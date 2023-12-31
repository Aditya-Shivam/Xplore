// ----------------------------------------------
// Imports
// ----------------------------------------------

import Stripe from 'stripe';
//const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import Tour from '../models/tourModel.js';
import User from '../models/userModel.js';
import Booking from '../models/bookingModel.js';
import catchAsync from '../utils/catchAsync.js';
import {
  getOne,
  getAll,
  createOne,
  updateOne,
  deleteOne,
} from '../controllers/handlerFactory.js';

// ----------------------------------------------
// Create a stripe checkout session
// ----------------------------------------------

// Asign the secret key
//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const getCheckoutSession = catchAsync(async (req, res, next) => {
  // Get the booked tour
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const tour = await Tour.findById(req.params.tourId);

  // Create checkout session
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ['card'],
  //   success_url: `${req.protocol}://${req.get(
  //     'host'
  //   )}/my-bookings?alert=booking`,
  //   cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
  //   customer_email: req.user.email,
  //   client_reference_id: req.params.tourId,
  //   line_items: [
  //     {
  //       name: `${tour.name} Tour`,
  //       description: tour.summary,
  //       images: [
  //         `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
  //       ],
  //       amount: tour.price * 100,
  //       currency: 'usd',
  //       quantity: 1,
  //     },
  //   ],
  // });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tours`,
            description: tour.summary,
            images: [
              'https://lh3.googleusercontent.com/p/AF1QipMbhx5bR2d15t-VL9Ws_EeZT3d1SUz56G5vIqlL=s1360-w1360-h1020',
            ], //[`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  // Send session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// ----------------------------------------------
// Create booking function
// ----------------------------------------------

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total;

  await Booking.create({ tour, user, price });
};

// ----------------------------------------------
// Webhook to be executed by Stripe
// ----------------------------------------------

export const webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

// ----------------------------------------------
// Booking CRUD methods
// ----------------------------------------------

export const createBooking = createOne(Booking);
export const getBooking = getOne(Booking);
export const getBookings = getAll(Booking);
export const updateBooking = updateOne(Booking);
export const deleteBooking = deleteOne(Booking);
