import {
  createBooking,
  getBookingById,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  updateBookingStatus,
  checkRoomAvailability,
  expirePendingBookings,
  updatePaymentStatus,
} from "../models/booking.model.js";

// =====================================================
// CREATE BOOKING
// =====================================================

// =====================================================
// CREATE BOOKING
// =====================================================

const postBooking = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      hotelId,
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
    } = req.body;

    console.log("CREATE BOOKING BODY:", req.body);

    // =================================================
    // REQUIRED FIELDS
    // =================================================

    if (
      !hotelId ||
      !roomId ||
      !checkIn ||
      !checkOut ||
      !adults ||
      !rooms
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hotel, room, check-in, check-out, adults and rooms are required",
      });
    }

    // =================================================
    // VALIDATE NUMBERS
    // =================================================

    const adultCount = Number(adults);
    const childCount = Number(children || 0);
    const roomCount = Number(rooms);
    const selectedRoomId = Number(roomId);

    if (
      !Number.isInteger(adultCount) ||
      adultCount < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Adults must be at least 1",
      });
    }

    if (
      !Number.isInteger(childCount) ||
      childCount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid children count",
      });
    }

    if (
      !Number.isInteger(roomCount) ||
      roomCount < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Rooms must be at least 1",
      });
    }

    if (
      !Number.isInteger(selectedRoomId) ||
      selectedRoomId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid room",
      });
    }

    // =================================================
    // VALIDATE DATES
    // =================================================

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date",
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date",
      });
    }

    // =================================================
    // CREATE BOOKING
    // =================================================

    const booking = await createBooking({
      userId,
      hotelId,
      roomId: selectedRoomId,
      checkIn,
      checkOut,
      adults: adultCount,
      children: childCount,
      rooms: roomCount,
    });

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });

  } catch (error) {
    console.log(
      "Create booking controller error:",
      error
    );

    // =================================================
    // HOTEL NOT FOUND
    // =================================================

    if (error.message === "HOTEL_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // =================================================
    // ROOM NOT FOUND
    // =================================================

    if (error.message === "ROOM_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Selected room not found",
      });
    }

    // =================================================
    // ROOM NOT AVAILABLE
    // =================================================

    if (error.message === "ROOM_NOT_AVAILABLE") {
      return res.status(409).json({
        success: false,
        message: "Selected room is not available",
      });
    }

    // =================================================
    // ROOMS NOT AVAILABLE
    // =================================================

    if (error.message === "ROOMS_NOT_AVAILABLE") {
      return res.status(409).json({
        success: false,
        message:
          "Requested rooms are not available for these dates",
      });
    }

    // =================================================
    // INVALID DATES
    // =================================================

    if (error.message === "INVALID_DATES") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking dates",
      });
    }

    // =================================================
    // SERVER ERROR
    // =================================================

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
    });
  }
};

// =====================================================
// GET SINGLE BOOKING
// =====================================================

const getBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.log("Get booking controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get booking",
    });
  }
};

// =====================================================
// GET MY BOOKINGS
// =====================================================

const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await getUserBookings(userId);

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.log("Get my bookings controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get your bookings",
    });
  }
};

// =====================================================
// CANCEL MY BOOKING
// =====================================================

const cancelMyBooking = async (req, res) => {
  try {
    const userId = req.user.id;

    const { id } = req.params;

    const cancelled = await cancelBooking(id, userId);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or cannot be cancelled",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.log("Cancel booking controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  }
};

// =====================================================
// ADMIN - GET ALL BOOKINGS
// =====================================================

const getBookings = async (req, res) => {
  try {
    const bookings = await getAllBookings();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.log("Get all bookings controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get bookings",
    });
  }
};

// =====================================================
// ADMIN - CHANGE BOOKING STATUS
// =====================================================

const changeBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { status } = req.body;

    // =================================================
    // ALLOWED STATUS
    // =================================================

    const allowedStatus = ["pending", "confirmed", "cancelled", "expired"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    // =================================================
    // UPDATE
    // =================================================

    const updated = await updateBookingStatus(id, status);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
    });
  } catch (error) {
    console.log("Update booking status controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update booking status",
    });
  }
};

// =====================================================
// CHECK ROOM AVAILABILITY
// =====================================================

const checkAvailability = async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut, rooms } = req.body;

    // =================================================
    // REQUIRED
    // =================================================

    if (!hotelId || !checkIn || !checkOut || rooms === undefined) {
      return res.status(400).json({
        success: false,
        message: "Hotel, check-in, check-out and rooms are required",
      });
    }

    // =================================================
    // ROOMS
    // =================================================

    const requestedRooms = Number(rooms);

    if (!Number.isInteger(requestedRooms) || requestedRooms <= 0) {
      return res.status(400).json({
        success: false,
        message: "Rooms must be a positive integer",
      });
    }

    // =================================================
    // DATES
    // =================================================

    const checkInDate = new Date(checkIn);

    const checkOutDate = new Date(checkOut);

    if (
      Number.isNaN(checkInDate.getTime()) ||
      Number.isNaN(checkOutDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date",
      });
    }

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date",
      });
    }

    // =================================================
    // CHECK DATABASE
    // =================================================

    const availability = await checkRoomAvailability({
      hotelId,
      checkIn,
      checkOut,
      rooms: requestedRooms,
    });

    // =================================================
    // HOTEL NOT FOUND
    // =================================================

    if (!availability.hotelExists) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // =================================================
    // NOT AVAILABLE
    // =================================================

    if (!availability.isAvailable) {
      return res.status(409).json({
        success: false,
        message: "Not enough rooms available",

        availableRooms: availability.availableRooms,

        requestedRooms: availability.requestedRooms,
      });
    }

    // =================================================
    // AVAILABLE
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Rooms are available",

      available: true,

      availability,
    });
  } catch (error) {
    console.log("Availability controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check room availability",
    });
  }
};

// =====================================================
// EXPIRE PENDING BOOKINGS
// =====================================================

const expireBookings = async (req, res) => {
  try {
    const expiredCount = await expirePendingBookings();

    return res.status(200).json({
      success: true,

      message: "Pending bookings expired successfully",

      expiredCount,
    });
  } catch (error) {
    console.log("Expire bookings controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to expire pending bookings",
    });
  }
};

// =====================================================
// UPDATE PAYMENT STATUS
// =====================================================

const changePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const updated = await updatePaymentStatus(
      id,
      status
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
    });

  } catch (error) {
    console.log(
      "Update payment status controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
};
// =====================================================
// EXPORT
// =====================================================

export {
  postBooking,
  getBooking,
  getMyBookings,
  cancelMyBooking,
  getBookings,
  changeBookingStatus,
  checkAvailability,
  expireBookings,
  changePaymentStatus
};
