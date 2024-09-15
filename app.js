// Core Modules
const path = require('path');
// NPM Modules
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
// Custom Modules
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

// Variables
const app = express();

// Setup Body Parser, A Requirement for Plaid
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());

// Setup Trust for Proxies (needed for Heroku)
app.enable('trust proxy');

// Template Engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));

// Serving static files to the browser
// Without path middleware
// app.use(express.static(`${__dirname}/public`));
// with path middleware
app.use(express.static(path.join(__dirname, '/public')));

// Global Middleware Declarations

// Enable CORS Globally

// Header: Access-Control-Allow-Origin = *
app.use(cors());
// Enable CORS internally
// app.use(
//   cors({
//     origin: 'https://natours.com'
//   })
// );
// Respond to Options request for CORS (pre-flight phase)
// Required for METHODS PUT/ PATCH/ DELETE
app.options('*', cors());

// Security HTTP Headers
// Implementing helmet for the HTTP headers
app.use(helmet());

// Development environment (for logging)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Implementing a rate limiter for one hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour.'
});
app.use('/api', limiter);

// Stripe Webhook for Checkout Session End
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
// URL encoded middleware option
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Cookie Parser, reading the data from the cookies
app.use(cookieParser());
// Data sanitization against NoSQL query injections attacks
app.use(mongoSanitize());
// Data sanitization against XSS attacks
app.use(xss());
// Prevent paramater pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Compression Middleware
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// Mounted Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   message: `Can't find ${req.originalUrl} on this server!`
  // });
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

// limiting login attempts example
// If you want to add a rate limiter for login attempts, you should keep
// track of it in the database so the client can't change their IP address
// to get around it.
//
// Set a limit in your code and add a field called loginAttempts and
// lockoutDate to the user model. When a user tries to login but fails,
// check the loginAttempts. If it's below the max then increment the
// loginAttemps by one. Don't allow the user to login if the attempts have
// reached the max and set the lockoutDate to be 30 minutes. Reset both once
// the lockoutDate has been passed.
