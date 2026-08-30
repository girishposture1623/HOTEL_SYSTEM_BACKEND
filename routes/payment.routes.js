import express from "express";

import {
  createPaymentOrder,
  paymentFailed,
  verifyPayment,
} from "../controllers/payment.controller.js";

import protect from "../middleware/auth.middleware.js";

const paymentRoute = express.Router();

paymentRoute.post(
  "/create-order",
  protect,
  createPaymentOrder
);
paymentRoute.post('/verify',protect, verifyPayment)
paymentRoute.post('/failed',protect, paymentFailed)

export default paymentRoute;