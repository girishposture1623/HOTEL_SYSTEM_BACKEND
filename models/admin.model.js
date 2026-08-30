import db from "../config/db.js";

const getDashboardStats = async () => {
  try {
    // Total users
    const [userRows] = await db.execute(
      `
      SELECT COUNT(*) AS totalUsers
      FROM users
      `
    );

    // Total hotels
    const [hotelRows] = await db.execute(
      `
      SELECT COUNT(*) AS totalHotels
      FROM hotels
      `
    );

    // Booking statistics
    const [bookingRows] = await db.execute(
      `
      SELECT
        COUNT(*) AS totalBookings,

        COALESCE(
          SUM(
            CASE
              WHEN booking_status = 'confirmed'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS confirmedBookings,

        COALESCE(
          SUM(
            CASE
              WHEN booking_status = 'pending'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS pendingBookings,

        COALESCE(
          SUM(
            CASE
              WHEN booking_status = 'cancelled'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS cancelledBookings

      FROM bookings
      `
    );

    const [revenueRows] = await db.execute(
      `
      SELECT
        COALESCE(
          SUM(total_price),
          0
        ) AS totalRevenue
      FROM bookings
      WHERE payment_status = 'paid'
        AND booking_status = 'confirmed'
      `
    );

    return {
      totalUsers:
        Number(userRows[0].totalUsers) || 0,

      totalHotels:
        Number(hotelRows[0].totalHotels) || 0,

      totalBookings:
        Number(bookingRows[0].totalBookings) || 0,

      confirmedBookings:
        Number(
          bookingRows[0].confirmedBookings
        ) || 0,

      pendingBookings:
        Number(
          bookingRows[0].pendingBookings
        ) || 0,

      cancelledBookings:
        Number(
          bookingRows[0].cancelledBookings
        ) || 0,

      totalRevenue:
        Number(
          revenueRows[0].totalRevenue
        ) || 0,
    };

  } catch (error) {
    console.log(
      "Get dashboard stats error:",
      error
    );

    throw error;
  }
};

const getRecentBookings = async () => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        b.id,
        b.check_in,
        b.check_out,
        b.rooms_booked,
        b.total_price,
        b.booking_status,
        b.payment_status,
        b.created_at,

        u.name AS user_name,
        u.email AS user_email,

        h.name AS hotel_name

      FROM bookings b

      LEFT JOIN users u
        ON b.user_id = u.id

      LEFT JOIN hotels h
        ON b.hotel_id = h.id

      ORDER BY b.created_at DESC

      LIMIT 10
      `
    );

    return rows;

  } catch (error) {
    console.log(
      "Get recent bookings error:",
      error
    );

    throw error;
  }
};

const getBookingOverview = async () => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS bookings
      FROM bookings
      WHERE created_at >= DATE_SUB(
        CURDATE(),
        INTERVAL 6 MONTH
      )
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
      `
    );

    return rows;

  } catch (error) {
    console.log(
      "Get booking overview error:",
      error
    );

    throw error;
  }
};

const getRevenueOverview = async () => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COALESCE(SUM(total_price), 0) AS revenue
      FROM bookings
      WHERE payment_status = 'paid'
        AND booking_status = 'confirmed'
        AND created_at >= DATE_SUB(
          CURDATE(),
          INTERVAL 6 MONTH
        )
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
      `
    );

    return rows;
  } catch (error) {
    console.log(
      "Get revenue overview error:",
      error
    );

    throw error;
  }
};


const getHotelAvailability = async () => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        h.id,
        h.name,
        h.total_rooms,

        COALESCE(
          SUM(
            CASE
              WHEN b.booking_status = 'confirmed'
                THEN b.rooms_booked

              WHEN b.booking_status = 'pending'
                AND b.expires_at > NOW()
                THEN b.rooms_booked

              ELSE 0
            END
          ),
          0
        ) AS booked_rooms

      FROM hotels h

      LEFT JOIN bookings b
        ON h.id = b.hotel_id

      GROUP BY
        h.id,
        h.name,
        h.total_rooms

      ORDER BY h.name ASC
      `
    );

    return rows.map((hotel) => {
      const totalRooms =
        Number(hotel.total_rooms) || 0;

      const bookedRooms =
        Number(hotel.booked_rooms) || 0;

      return {
        id: hotel.id,
        name: hotel.name,
        totalRooms,
        bookedRooms,
        availableRooms:
          Math.max(
            totalRooms - bookedRooms,
            0
          ),
      };
    });

  } catch (error) {
    console.log(
      "Get hotel availability error:",
      error
    );

    throw error;
  }
};

const getAllUsers = async () => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        role,
        is_verified,
        created_at
      FROM users
      ORDER BY created_at DESC
      `
    );

    return rows;
  } catch (error) {
    console.log("Get all users error:", error);
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        role,
        is_verified,
        created_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    return rows[0] || null;
  } catch (error) {
    console.log("Get user by ID error:", error);
    throw error;
  }
};

const updateUserByAdmin = async (
  userId,
  { name, role, is_verified }
) => {
  try {
    const [result] = await db.execute(
      `
      UPDATE users
      SET
        name = ?,
        role = ?,
        is_verified = ?
      WHERE id = ?
      `,
      [
        name,
        role,
        is_verified,
        userId,
      ]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log(
      "Update user by admin error:",
      error
    );

    throw error;
  }
};

const deleteUserByAdmin = async (userId) => {
  try {
    const [result] = await db.execute(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [userId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log(
      "Delete user by admin error:",
      error
    );

    throw error;
  }
};

export {
  getDashboardStats,
  getRecentBookings,
  getBookingOverview,
  getHotelAvailability,
  getRevenueOverview,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deleteUserByAdmin
};