// Custom Modules
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking') {
    res.locals.alert =
      "Your tour was successfully booked. Please check your email for a confirmation. If your booking doesn't show up here immediately, please check back later.";
  }
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get Tour data from DB
  const tours = await Tour.find();
  // 2. Build template
  // 3. Render the template including the data
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. Get the data for the requested tour
  // include reviews and tour guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // 2. Build the template
  // 3. render template including the data
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Account Login'
  });
};
exports.testPlaid = (req, res) => {
  res.status(200).render('plaid', {
    title: 'Testing Plaid'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('profile', {
    title: 'My Account'
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1. Find all of the bookings for the logged in user
  const bookings = await Booking.find({ user: req.user.id });
  // 2. Find the tours for all bookings
  // Put all tour IDs in an array
  const tourIDs = bookings.map(el => el.tour);
  // Match tour info based on tour ID array
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  // 3. Display tour cards for all booked tours
  res.status(200).render('overview', {
    title: 'My Booked Tours',
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res.status(200).render('profile', {
    title: 'Account Login',
    user: updatedUser
  });
});
