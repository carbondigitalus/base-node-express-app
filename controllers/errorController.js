const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  // console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again.', 401);
const sendErrorDev = (err, req, res) => {
  // If the route contains 'API' send JSON
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Otherwise, send the 404 page.
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
};

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please login again.', 401);
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api') && err.isOperational) {
    // If the route contains 'API'
    // AND the error IS Operational
    // Send JSON
    // Operational errors, trusted error: send the message to the client
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else if (req.originalUrl.startsWith('/api') && !err.isOperational) {
    // If the route contains 'API'
    // AND the error IS NOT Operational
    // Non-Operational Error: Programming or other unknown error
    // Non-Operational Errors: don't leak error details to client
    // Send generic response
    console.log('Error', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong.'
    });
  } else if (!req.originalUrl.startsWith('/api') && err.isOperational) {
    // If the route does NOT contain 'API'
    // AND if the error IS OPERATIONAL
    // Send the normal JSON
    console.log(err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  } else {
    // Otherwise, send the 404 page.
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later.'
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
