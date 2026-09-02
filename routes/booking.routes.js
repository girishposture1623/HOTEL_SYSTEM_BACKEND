import express from "express";

import {
  postBooking,
  getBooking,
  getMyBookings,
  cancelMyBooking,
  checkAvailability,
  changePaymentStatus,
} from "../controllers/booking.controller.js";

import protect from "../middleware/auth.middleware.js";
import { availabilityValidation } from "../middleware/booking.validation.js";
import validate from "../middleware/validation.middleware.js";

const bookingRoute = express.Router();

// Check room availability
bookingRoute.post(
  "/availability",
  protect,
  availabilityValidation,
  validate,
  checkAvailability,
);

// Create booking
bookingRoute.post("/", protect, availabilityValidation, validate, postBooking);

// User bookings
bookingRoute.get("/my-bookings", protect, getMyBookings);

// Single booking
bookingRoute.get("/:id", protect, getBooking);

// Cancel booking
bookingRoute.patch("/:id/cancel", protect, cancelMyBooking);

bookingRoute.patch(
  "/:id/payment-status",
  protect,
  changePaymentStatus
);

export default bookingRoute;
