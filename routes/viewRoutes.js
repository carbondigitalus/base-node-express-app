// NPM Modules
const express = require('express');

// Custom Modules
const viewController = require('./../controllers/viewController');
// const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

// Enable Alerts for all pages
router.use(viewController.alerts);

router.get(
    '/',
    // bookingController.createBookingCheckout,
    authController.isLoggedIn,
    viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);

// Form POST Reqest
router.post(
    '/submit-user-data',
    authController.protect,
    viewController.updateUserData
);

module.exports = router;
