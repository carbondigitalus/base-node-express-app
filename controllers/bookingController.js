// NPM Modules
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Custom Modules
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
// const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    // Add session options
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      // The field names (left side) are defined by Stripe
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });
  // 3. Send session to client
  res.status(200).json({
    status: 'success',
    session
  });
});

// This exports function is only valid prior to deployment
// After deployment we can use the Stripe webhooks
// Live site: skip to webhookCheckout export.
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // TEMPORARY SOLUTION: WEBSITE NEEDS TO BE LAUNCHED BEFORE THIS CAN BE FIXED
//   // Capture required data from query string
//   const { tour, user, price } = req.query;
//   // If the require data isn't present, skip to next middleware
//   if (!tour && !user && !price) return next();
//   // Wait for the Booking to be created
//   await Booking.create({ tour, user, price });
//   // Redirect to home instead of a non-secure query string URL
//   res.redirect(req.originalUrl.split('?')[0]);
// });

// New Function Inside Webhook Checkout
const createBookingCheckout = async session => {
  // Create Vars from Session function above
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].amount / 100;
  // Wait for the Booking to be created
  await Booking.create({ tour, user, price });
};

// On Live Site: Use this function.
// On Dev Site: Use the above function.
exports.webhookCheckout = (req, res, next) => {
  // Read the headers for the stripe signature
  const signature = req.headers['stripe-signature'];
  // Delare event
  let event;
  try {
    // Create stripe event
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  // Verify event type
  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);
  // Send response back to stripe
  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
