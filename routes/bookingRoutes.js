// NPM Modules
const express = require('express');
// Custom Mosules
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

// All below routes use authController.protect
router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// All below routes are restricted to 'admin' and 'lead-guide'
router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
