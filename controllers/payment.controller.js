import razorpay from "../config/razorpay.js";
import crypto from "crypto";

import {
  confirmPaidBooking,
  getBookingByRazorpayOrderId,
  getBookingForPayment,
  getBookingForVerification,
  markBookingRefunded,
  markPaymentFailed,
  savePaymentDetails,
  saveRazorpayOrderId,
} from "../models/payment.model.js";
import { checkRoomAvailability } from "../models/booking.model.js";
import {
  isWebhookProcessed,
  saveWebhookEvent,
} from "../models/webhook.model.js";


const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    // Get booking from database
    const booking = await getBookingForPayment(bookingId, userId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Booking must be pending
    if (booking.booking_status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This booking is no longer available for payment",
      });
    }

    // Payment must be pending
    if (booking.payment_status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Payment is already processed",
      });
    }

    // Check hold expiry
    if (booking.expires_at && new Date(booking.expires_at) <= new Date()) {
      return res.status(410).json({
        success: false,
        message: "Booking hold has expired. Please try again.",
      });
    }

    // ----------------------------------
    // Amount from DATABASE
    // ----------------------------------

    const amountInRupees = Number(booking.total_price);

    const amountInPaise = Math.round(amountInRupees * 100);

    if (amountInPaise < 1000) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be at least ₹10",
      });
    }

    // ----------------------------------
    // Create Razorpay Order
    // ----------------------------------

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",

      receipt: `booking_${bookingId}_${Date.now()}`,

      notes: {
        booking_id: String(bookingId),
        user_id: String(userId),
      },

      partial_payment: false,
    });

    // Save Razorpay order ID
    await saveRazorpayOrderId(bookingId, order.id);

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",

      payment: {
        key: process.env.RAZORPAY_KEY_ID,

        orderId: order.id,

        bookingId: booking.id,

        amount: order.amount,

        currency: order.currency,
      },
    });
  } catch (error) {
    console.log("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      bookingId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    console.log("VERIFY PAYMENT DATA:", {
      bookingId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });

    if (
      !bookingId ||
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
    }

    const booking =
      await getBookingForVerification(
        bookingId,
        userId
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    console.log(
      "DB ORDER ID:",
      booking.razorpay_order_id
    );

    console.log(
      "SECRET EXISTS:",
      !!process.env.RAZORPAY_KEY_SECRET
    );

    if (
      booking.booking_status !== "pending" ||
      booking.payment_status !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking is no longer payable",
      });
    }

    if (
      booking.expires_at &&
      new Date(booking.expires_at) <= new Date()
    ) {
      return res.status(410).json({
        success: false,
        message: "Booking hold has expired",
      });
    }

    if (
      booking.razorpay_order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment order",
      });
    }

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${booking.razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    console.log(
      "GENERATED SIGNATURE:",
      generatedSignature
    );

    console.log(
      "RAZORPAY SIGNATURE:",
      razorpay_signature
    );

    if (
      generatedSignature !==
      razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    await savePaymentDetails({
      bookingId,
      paymentId:
        razorpay_payment_id,
      orderId:
        razorpay_order_id,
      signature:
        razorpay_signature,
    });

    const availability =
      await checkRoomAvailability({
        hotelId: booking.hotel_id,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        rooms: booking.rooms_booked,
        excludeBookingId: booking.id,
      });

    if (!availability.isAvailable) {

      try {

        const refund =
          await razorpay.payments.refund(
            razorpay_payment_id,
            {
              amount:
                Math.round(
                  Number(
                    booking.total_price
                  ) * 100
                ),

              speed: "normal",

              notes: {
                booking_id:
                  String(bookingId),

                reason:
                  "Rooms unavailable after payment",
              },
            }
          );

        await markBookingRefunded(
          bookingId
        );

        return res.status(409).json({
          success: false,
          refunded: true,

          message:
            "Rooms are no longer available. Your payment has been refunded.",

          refundId:
            refund.id,
        });

      } catch (refundError) {

        console.log(
          "Refund error:",
          refundError
        );

        return res.status(500).json({
          success: false,
          refunded: false,

          message:
            "Rooms unavailable and refund could not be completed automatically. Please contact support.",
        });
      }
    }

    const confirmed =
      await confirmPaidBooking(
        bookingId
      );

    if (!confirmed) {
      return res.status(409).json({
        success: false,
        message:
          "Unable to confirm booking",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Payment successful and booking confirmed",

      bookingId,
    });

  } catch (error) {

    console.log(
      "Verify payment controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Payment verification failed",
    });
  }
};

const paymentFailed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const booking = await getBookingForVerification(
      bookingId,
      userId
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.booking_status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Booking is no longer pending",
      });
    }

    await markPaymentFailed(bookingId);

    return res.status(200).json({
      success: true,
      message: "Payment failed and booking cancelled",
    });

  } catch (error) {
    console.log("Payment failed controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
};

const razorpayWebhook = async (req, res) => {
  try {
    const webhookSignature =
      req.headers["x-razorpay-signature"];

    const eventId =
      req.headers["x-razorpay-event-id"];

    if (!webhookSignature || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook request",
      });
    }

    // req.body is RAW Buffer
    const rawBody = req.body.toString();


    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(rawBody)
        .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(webhookSignature)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // Parse only AFTER signature verification
    const payload = JSON.parse(rawBody);

    const eventName = payload.event;


    const alreadyProcessed =
      await isWebhookProcessed(eventId);

    if (alreadyProcessed) {
      return res.status(200).json({
        success: true,
        message: "Webhook already processed",
      });
    }

    // Save event ID
    await saveWebhookEvent(
      eventId,
      eventName
    );


    // ----------------------------------
    // PAYMENT CAPTURED
    // ----------------------------------

    if (eventName === "payment.captured") {

      const payment =
        payload.payload.payment.entity;

      const paymentId =
        payment.id;

      const razorpayOrderId =
        payment.order_id;


      // Find booking using Razorpay order ID
      const booking =
        await getBookingByRazorpayOrderId(
          razorpayOrderId
        );


      if (!booking) {
        console.log(
          "Booking not found for order:",
          razorpayOrderId
        );

        return res.status(200).json({
          success: true,
        });
      }


      // Already confirmed
      if (
        booking.booking_status === "confirmed" &&
        booking.payment_status === "paid"
      ) {
        return res.status(200).json({
          success: true,
          message: "Booking already confirmed",
        });
      }


      // Save payment details
      await savePaymentDetails({
        bookingId: booking.id,
        paymentId,
        orderId: razorpayOrderId,
        signature: null,
      });


      const availability =
        await checkRoomAvailability({
          hotelId: booking.hotel_id,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          rooms: booking.rooms_booked,
          excludeBookingId: booking.id,
        });


      if (!availability.isAvailable) {

        try {

          const refund =
            await razorpay.payments.refund(
              paymentId,
              {
                amount: Math.round(
                  Number(
                    booking.total_price
                  ) * 100
                ),

                speed: "normal",

                notes: {
                  booking_id:
                    String(booking.id),

                  reason:
                    "Rooms unavailable after payment",
                },
              }
            );


          await markBookingRefunded(
            booking.id
          );


          console.log(
            "Payment refunded:",
            refund.id
          );

        } catch (refundError) {

          console.log(
            "Webhook refund error:",
            refundError
          );
        }

        return res.status(200).json({
          success: true,
        });
      }

      await confirmPaidBooking(
        booking.id
      );


      console.log(
        `Booking ${booking.id} confirmed`
      );
    }

    if (eventName === "payment.failed") {

      const payment =
        payload.payload.payment.entity;

      const razorpayOrderId =
        payment.order_id;


      const booking =
        await getBookingByRazorpayOrderId(
          razorpayOrderId
        );


      if (booking) {

        // Important:
        // payment.failed can be followed
        // by payment.captured for some flows,
        // so don't permanently destroy
        // a booking here if your checkout
        // allows retries.

        console.log(
          `Payment failed for booking ${booking.id}`
        );
      }
    }


    return res.status(200).json({
      success: true,
    });

  } catch (error) {

    console.log(
      "Razorpay webhook error:",
      error
    );

    return res.status(500).json({
      success: false,
    });
  }
};

export { createPaymentOrder, verifyPayment, paymentFailed , razorpayWebhook};
