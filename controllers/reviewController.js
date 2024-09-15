// Custom Modules
const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utils/catchAsync');

// Route Handler Functions

exports.setTourUserIds = (req, res, next) => {
  // NESTED ROUTES DYNAMIC INFO
  // If no tour was selected, pull the tour ID from the URL
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // If no user was selected, pull the user ID from the protect middleware
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
