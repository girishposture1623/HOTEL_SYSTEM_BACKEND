import {
  createBooking,
  getBookingById,
  getUserBookings,
  getAllBookings,
  cancelBooking,
  updateBookingStatus,
  checkRoomAvailability,
  expirePendingBookings,
} from "../models/booking.model.js";


const postBooking = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      hotelId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
    } = req.body;


    // ----------------------------------
    // Required fields
    // ----------------------------------

    if (
      !hotelId ||
      !checkIn ||
      !checkOut ||
      !adults ||
      !rooms
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hotel, check-in, check-out, adults and rooms are required",
      });
    }


    // ----------------------------------
    // Validate numbers
    // ----------------------------------

    if (
      Number(adults) < 1 ||
      Number(rooms) < 1 ||
      Number(children || 0) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid guest or room count",
      });
    }


    // ----------------------------------
    // Validate dates
    // ----------------------------------

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (
      isNaN(checkInDate.getTime()) ||
      isNaN(checkOutDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in or check-out date",
      });
    }


    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message:
          "Check-out date must be after check-in date",
      });
    }


    // ----------------------------------
    // Create booking
    // ----------------------------------

    const booking = await createBooking({
      userId,
      hotelId,
      checkIn,
      checkOut,
      adults: Number(adults),
      children: Number(children || 0),
      rooms: Number(rooms),
    });


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


    // Hotel not found
    if (error.message === "HOTEL_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }


    // Rooms unavailable
    if (error.message === "ROOMS_NOT_AVAILABLE") {
      return res.status(409).json({
        success: false,
        message:
          "Requested rooms are not available for these dates",
      });
    }


    // Invalid dates
    if (error.message === "INVALID_DATES") {
      return res.status(400).json({
        success: false,
        message: "Invalid booking dates",
      });
    }


    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
    });
  }
};

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

    console.log(
      "Get booking controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get booking",
    });
  }
};

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

    console.log(
      "Get my bookings controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get your bookings",
    });
  }
};

const cancelMyBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cancelled = await cancelBooking(
      id,
      userId
    );

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found or cannot be cancelled",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });

  } catch (error) {

    console.log(
      "Cancel booking controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await getAllBookings();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });

  } catch (error) {

    console.log(
      "Get all bookings controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get bookings",
    });
  }
};

const changeBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;


    const allowedStatus = [
      "pending",
      "confirmed",
      "cancelled",
    ];


    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }


    const updated = await updateBookingStatus(
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
      message: "Booking status updated successfully",
    });

  } catch (error) {

    console.log(
      "Update booking status controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update booking status",
    });
  }
};

const checkAvailability = async (req, res) => {
  try {
    const {
      hotelId,
      checkIn,
      checkOut,
      rooms,
    } = req.body;

    // Required fields
    if (
      !hotelId ||
      !checkIn ||
      !checkOut ||
      rooms === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hotel, check-in, check-out and rooms are required",
      });
    }

    // Validate rooms
    const requestedRooms = Number(rooms);

    if (
      !Number.isInteger(requestedRooms) ||
      requestedRooms <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rooms must be a positive integer",
      });
    }

    // Validate dates
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
        message:
          "Check-out date must be after check-in date",
      });
    }

    const availability =
      await checkRoomAvailability({
        hotelId,
        checkIn,
        checkOut,
        rooms: requestedRooms,
      });

    if (!availability.hotelExists) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    if (!availability.isAvailable) {
      return res.status(409).json({
        success: false,
        message: "Not enough rooms available",
        availableRooms:
          availability.availableRooms,
        requestedRooms:
          availability.requestedRooms,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rooms are available",
      available: true,
      availability,
    });

  } catch (error) {
    console.log(
      "Availability controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to check room availability",
    });
  }
};

const expireBookings = async (req, res) => {
  try {
    const expiredCount = await expirePendingBookings();

    return res.status(200).json({
      success: true,
      message: "Pending bookings expired successfully",
      expiredCount,
    });

  } catch (error) {
    console.log(
      "Expire bookings controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to expire pending bookings",
    });
  }
};

export {
  postBooking,
  getBooking,
  getMyBookings,
  cancelMyBooking,
  getBookings,
  changeBookingStatus,
  checkAvailability,
  expirePendingBookings,
  expireBookings
};