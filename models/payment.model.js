import db from "../config/db.js";


const getBookingForPayment = async (
  bookingId,
  userId
) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        id,
        user_id,
        hotel_id,
        total_price,
        booking_status,
        payment_status,
        expires_at,
        razorpay_order_id
      FROM bookings
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [
        bookingId,
        userId,
      ]
    );

    return rows[0] || null;

  } catch (error) {
    console.log(
      "Get booking for payment error:",
      error
    );

    throw error;
  }
};



const saveRazorpayOrderId = async (
  bookingId,
  razorpayOrderId
) => {
  try {
    const [result] = await db.execute(
      `
      UPDATE bookings
      SET razorpay_order_id = ?
      WHERE id = ?
      `,
      [
        razorpayOrderId,
        bookingId,
      ]
    );

    return result.affectedRows > 0;

  } catch (error) {
    console.log(
      "Save Razorpay order ID error:",
      error
    );

    throw error;
  }
};

const getBookingForVerification = async (
  bookingId,
  userId
) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        id,
        user_id,
        hotel_id,
        check_in,
        check_out,
        rooms_booked,
        total_price,
        booking_status,
        payment_status,
        expires_at,
        razorpay_order_id
      FROM bookings
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [bookingId, userId]
    );

    return rows[0] || null;
  } catch (error) {
    console.log(
      "Get booking for verification error:",
      error
    );

    throw error;
  }
};


const savePaymentDetails = async ({
  bookingId,
  paymentId,
  orderId,
  signature,
}) => {
  try {
    const [result] = await db.execute(
      `
      UPDATE bookings
      SET
        razorpay_payment_id = ?,
        razorpay_order_id = ?,
        razorpay_signature = ?
      WHERE id = ?
      `,
      [
        paymentId,
        orderId,
        signature,
        bookingId,
      ]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log(
      "Save payment details error:",
      error
    );

    throw error;
  }
};


const confirmPaidBooking = async (bookingId) => {
  try {
    const [result] = await db.execute(
      `
      UPDATE bookings
      SET
        booking_status = 'confirmed',
        payment_status = 'paid',
        expires_at = NULL
      WHERE id = ?
        AND booking_status = 'pending'
        AND payment_status = 'pending'
      `,
      [bookingId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log(
      "Confirm paid booking error:",
      error
    );

    throw error;
  }
};


const markPaymentFailed = async (bookingId) => {
  try {
    const [result] = await db.execute(
      `
      UPDATE bookings
      SET
        booking_status = 'cancelled',
        payment_status = 'failed'
      WHERE id = ?
        AND booking_status = 'pending'
      `,
      [bookingId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log(
      "Mark payment failed error:",
      error
    );

    throw error;
  }
};


const markBookingRefunded = async (bookingId) => {
  try {
    const [result] = await db.execute(
      `
      UPDATE bookings
      SET
        booking_status = 'cancelled',
        payment_status = 'refunded'
      WHERE id = ?
      `,
      [bookingId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log(
      "Mark booking refunded error:",
      error
    );

    throw error;
  }
};

const getBookingByRazorpayOrderId = async (
  orderId
) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        id,
        user_id,
        hotel_id,
        check_in,
        check_out,
        rooms_booked,
        total_price,
        booking_status,
        payment_status,
        expires_at,
        razorpay_order_id
      FROM bookings
      WHERE razorpay_order_id = ?
      LIMIT 1
      `,
      [orderId]
    );

    return rows[0] || null;
  } catch (error) {
    console.log(
      "Get booking by Razorpay order ID error:",
      error
    );

    throw error;
  }
};
export {
  getBookingForPayment,
  saveRazorpayOrderId,
  getBookingForVerification,
  savePaymentDetails,
  confirmPaidBooking,
  markPaymentFailed,
  markBookingRefunded,
  getBookingByRazorpayOrderId
};
