import db from "../config/db.js";



const createBooking = async ({
  userId,
  hotelId,
  checkIn,
  checkOut,
  adults,
  children,
  rooms,
}) => {
  let connection;

  try {
    connection = await db.getConnection();

    await connection.beginTransaction();

    const [hotelRows] = await connection.execute(
      `
      SELECT
        id,
        name,
        price_per_night,
        total_rooms
      FROM hotels
      WHERE id = ?
      LIMIT 1
      `,
      [hotelId]
    );

    if (hotelRows.length === 0) {
      throw new Error("HOTEL_NOT_FOUND");
    }

    const hotel = hotelRows[0];


    const [bookingRows] = await connection.execute(
  `
  SELECT
    COALESCE(SUM(rooms_booked), 0) AS booked_rooms
  FROM bookings
  WHERE hotel_id = ?

    AND booking_status IN ('pending', 'confirmed')

    AND (
      booking_status = 'confirmed'
      OR expires_at > NOW()
    )

    AND check_in < ?
    AND check_out > ?
  `,
  [
    hotelId,
    checkOut,
    checkIn,
  ]
);

    const bookedRooms =
      Number(bookingRows[0].booked_rooms) || 0;

    const requestedRooms = Number(rooms);

    const availableRooms =
      hotel.total_rooms - bookedRooms;


    if (requestedRooms > availableRooms) {
      throw new Error("ROOMS_NOT_AVAILABLE");
    }


    

    const [dateRows] = await connection.execute(
      `
      SELECT DATEDIFF(?, ?) AS nights
      `,
      [
        checkOut,
        checkIn,
      ]
    );

    const nights = Number(dateRows[0].nights);


    if (nights <= 0) {
      throw new Error("INVALID_DATES");
    }


 

    const pricePerNight =
      Number(hotel.price_per_night);

    const totalPrice =
      pricePerNight *
      nights *
      requestedRooms;


 const expiresAt = new Date(
  Date.now() + 10 * 60 * 1000
);

const [result] = await connection.execute(
  `
  INSERT INTO bookings
  (
    user_id,
    hotel_id,
    check_in,
    check_out,
    adults,
    children,
    rooms_booked,
    total_price,
    booking_status,
    payment_status,
    expires_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)
  `,
  [
    userId,
    hotelId,
    checkIn,
    checkOut,
    adults,
    children,
    requestedRooms,
    totalPrice,
    expiresAt,
  ]
);


    await connection.commit();


    return {
  id: result.insertId,
  userId,
  hotelId,
  hotelName: hotel.name,
  checkIn,
  checkOut,
  adults,
  children,
  rooms: requestedRooms,
  nights,
  pricePerNight,
  totalPrice,
  bookingStatus: "pending",
  paymentStatus: "pending",
  expiresAt,
};

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.log(
      "Create booking model error:",
      error
    );

    throw error;

  } finally {

    if (connection) {
      connection.release();
    }

  }
};

const getBookingById = async (id) => {
  try {

    const [rows] = await db.execute(
      `
      SELECT
        b.id,
        b.user_id,
        b.hotel_id,

        b.check_in,
        b.check_out,

        b.adults,
        b.children,
        b.rooms_booked,

        b.total_price,

        b.booking_status,
        b.payment_status,

        b.created_at,

        h.name AS hotel_name,
        h.location AS hotel_location,
        h.price_per_night,

        (
          SELECT hi.image_url
          FROM hotel_images hi
          WHERE hi.hotel_id = h.id
          ORDER BY hi.id ASC
          LIMIT 1
        ) AS hotel_image

      FROM bookings b

      INNER JOIN hotels h
        ON b.hotel_id = h.id

      WHERE b.id = ?

      LIMIT 1
      `,
      [id]
    );

    return rows[0] || null;

  } catch (error) {

    console.log(
      "Get booking by ID model error:",
      error
    );

    throw error;
  }
};

const getUserBookings = async (userId) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        b.id,

        b.check_in,
        b.check_out,

        b.adults,
        b.children,
        b.rooms_booked,

        b.total_price,

        b.booking_status,
        b.payment_status,

        b.created_at,

        h.id AS hotel_id,
        h.name AS hotel_name,
        h.location AS hotel_location,
        h.price_per_night,

        (
          SELECT hi.image_url
          FROM hotel_images hi
          WHERE hi.hotel_id = h.id
          ORDER BY hi.id ASC
          LIMIT 1
        ) AS hotel_image

      FROM bookings b

      INNER JOIN hotels h
        ON b.hotel_id = h.id

      WHERE b.user_id = ?

      ORDER BY b.created_at DESC
      `,
      [userId]
    );

    return rows;

  } catch (error) {
    console.log(
      "Get user bookings model error:",
      error
    );

    throw error;
  }
};

const getAllBookings = async () => {
  try {

    const [rows] = await db.execute(
      `
      SELECT
        b.id,

        b.check_in,
        b.check_out,

        b.adults,
        b.children,
        b.rooms_booked,

        b.total_price,

        b.booking_status,
        b.payment_status,

        b.created_at,

        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,

        h.id AS hotel_id,
        h.name AS hotel_name,
        h.location AS hotel_location

      FROM bookings b

      INNER JOIN users u
        ON b.user_id = u.id

      INNER JOIN hotels h
        ON b.hotel_id = h.id

      ORDER BY b.created_at DESC
      `
    );

    return rows;

  } catch (error) {

    console.log(
      "Get all bookings model error:",
      error
    );

    throw error;
  }
};

const cancelBooking = async (
  bookingId,
  userId
) => {
  try {

    const [result] = await db.execute(
      `
      UPDATE bookings
      SET booking_status = 'cancelled'
      WHERE id = ?
        AND user_id = ?
        AND booking_status IN ('pending', 'confirmed')
      `,
      [
        bookingId,
        userId,
      ]
    );

    return result.affectedRows > 0;

  } catch (error) {

    console.log(
      "Cancel booking model error:",
      error
    );

    throw error;
  }
};

const updateBookingStatus = async (
  bookingId,
  status
) => {
  try {

    const [result] = await db.execute(
      `
      UPDATE bookings
      SET booking_status = ?
      WHERE id = ?
      `,
      [
        status,
        bookingId,
      ]
    );

    return result.affectedRows > 0;

  } catch (error) {

    console.log(
      "Update booking status model error:",
      error
    );

    throw error;
  }
};

const updatePaymentStatus = async (
  bookingId,
  status
) => {
  try {

    const [result] = await db.execute(
      `
      UPDATE bookings
      SET payment_status = ?
      WHERE id = ?
      `,
      [
        status,
        bookingId,
      ]
    );

    return result.affectedRows > 0;

  } catch (error) {

    console.log(
      "Update payment status model error:",
      error
    );

    throw error;
  }
};

const checkRoomAvailability = async ({
  hotelId,
  checkIn,
  checkOut,
  rooms,
  excludeBookingId = null,
}) => {
  try {
    const [hotelRows] = await db.execute(
      `
      SELECT
        id,
        name,
        total_rooms
      FROM hotels
      WHERE id = ?
      LIMIT 1
      `,
      [hotelId]
    );

    if (hotelRows.length === 0) {
      return {
        hotelExists: false,
      };
    }

    const hotel = hotelRows[0];

    let query = `
      SELECT
        COALESCE(SUM(rooms_booked), 0) AS booked_rooms
      FROM bookings
      WHERE hotel_id = ?

        AND booking_status IN ('pending', 'confirmed')

        AND (
          booking_status = 'confirmed'
          OR expires_at > NOW()
        )

        AND check_in < ?
        AND check_out > ?
    `;

    const params = [
      hotelId,
      checkOut,
      checkIn,
    ];


    // Current booking स्वतः count करू नये
    if (excludeBookingId) {
      query += `
        AND id != ?
      `;

      params.push(excludeBookingId);
    }


    const [bookingRows] =
      await db.execute(
        query,
        params
      );


    const bookedRooms =
      Number(
        bookingRows[0].booked_rooms
      ) || 0;

    const totalRooms =
      Number(hotel.total_rooms);

    const requestedRooms =
      Number(rooms);

    const availableRooms =
      totalRooms - bookedRooms;


    return {
      hotelExists: true,
      hotelId: hotel.id,
      hotelName: hotel.name,
      totalRooms,
      bookedRooms,
      availableRooms,
      requestedRooms,
      isAvailable:
        requestedRooms <= availableRooms,
    };

  } catch (error) {

    console.log(
      "Check room availability error:",
      error
    );

    throw error;
  }
};

const expirePendingBookings = async () => {
  try {
    const [result] = await db.execute(
      `
      UPDATE bookings
      SET booking_status = 'expired'
      WHERE booking_status = 'pending'
        AND payment_status = 'pending'
        AND expires_at IS NOT NULL
        AND expires_at <= NOW()
      `
    );

    return result.affectedRows;

  } catch (error) {
    console.log(
      "Expire pending bookings model error:",
      error
    );

    throw error;
  }
};

export {
  createBooking,
  getBookingById,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  updateBookingStatus,
  updatePaymentStatus,
  checkRoomAvailability,
  expirePendingBookings
};