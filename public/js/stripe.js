/* eslint-disable */

// ----------------------------------------------
// Imports
// ----------------------------------------------

import { showAlert } from './alerts.js';

// ----------------------------------------------
// Book tour and charge customer
// ----------------------------------------------

const stripe = Stripe(
  'pk_test_51MZA1xSIcZyzhAtmlQQKHOdVvQQ09PxqvRQ8755hwgTs9PRBAY1KJDKv3o5Dv5cAR2AHaomV9mFUf7QKuwYozVAk00qY3Ah3pf'
);

export const bookTour = async tourId => {
  try {
    // Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
