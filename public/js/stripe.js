/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';
// Scripts on page
const stripe = Stripe('pk_test_yzTneVpqA1L0z8z7jFShxYFP');

export const bookTour = async tourId => {
  try {
    // 1. Get the checkout session
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);
    // 2. Use Stripe object to create checkout form + charging the cards
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
