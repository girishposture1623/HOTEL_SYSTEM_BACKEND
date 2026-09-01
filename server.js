import dotenv from "dotenv";
dotenv.config();

import express from "express";
import db from "./config/db.js";
import authRoute from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import hotelRoute from "./routes/hotel.routes.js";
import paymentRoute from "./routes/payment.routes.js";
import { razorpayWebhook } from "./controllers/payment.controller.js";
import bookingRoute from "./routes/booking.routes.js";
import adminRoute from "./routes/admin.route.js";
import startBookingExpiryJob from "./jobs/bookingExpiry.job.js";
import errorHandler from "./middleware/error.middleware.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

process.env.NODE_ENV =
  process.env.NODE_ENV || "development";

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
  razorpayWebhook,
);

app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  // message: {
  //   success: false,
  //   message: "Too many authentication attempts. Try again later.",
  // },
  handler:(req, res)=>{
res.redirect(`${process.env.FRONTEND_URL}/auth-error`)
  }
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Hotel Booking API is running",
  });
});



app.use("/api/auth", authLimiter,authRoute);
app.use("/api/home", hotelRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/admin", adminRoute);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    const coonection = await db.getConnection();
    console.log("MySQL Connected Successfully");

    coonection.release();

    startBookingExpiryJob();

    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.log("MySQL Connection Error:", error.message);
  }
});
