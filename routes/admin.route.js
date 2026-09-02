import express from "express";

import protect from "../middleware/auth.middleware.js";
import adminOnly from "../middleware/admin.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
  getAllHotels,
  getHotelid,
  postHotel,
  putHotel,
  removeHotel,
  removeHotelImage,
} from "../controllers/hotel.controller.js";

import {
  getBookings,
  changeBookingStatus,
} from "../controllers/booking.controller.js";

import {
  allUsers,
  bookingOverview,
  dashboardStats,
  deleteUser,
  hotelAvailability,
  recentBookings,
  revenueOverview,
  singleUser,
  updateUser,
} from "../controllers/admin.controller.js";
import { createHotelValidation } from "../middleware/hotel.validation.js";
import validate from "../middleware/validation.middleware.js";

import {
  addRoom,
  getHotelRooms,
  getRoom,
  editRoom,
  removeRoom,
  removeRoomImage,
} from "../controllers/room.controller.js";

const adminRoute = express.Router();

adminRoute.use(protect);
adminRoute.use(adminOnly);

adminRoute.get("/hotels", getAllHotels);

adminRoute.get("/hotels/:id", getHotelid);

adminRoute.post(
  "/hotels",
  upload.array("images", 10),
  createHotelValidation,
  validate,
  postHotel,
);

adminRoute.patch(
  "/hotels/:id",
  upload.array("images", 10),
  createHotelValidation,
  validate,
  putHotel,
);
adminRoute.delete("/hotels/:id/images/:imageId", removeHotelImage);

adminRoute.delete("/hotels/:id", removeHotel);

adminRoute.get("/bookings", getBookings);

adminRoute.patch("/bookings/:id/status", changeBookingStatus);

adminRoute.get("/dashboard", dashboardStats);

adminRoute.get("/recent-bookings", recentBookings);

adminRoute.get("/booking-overview", bookingOverview);

adminRoute.get("/revenue-overview", revenueOverview);

adminRoute.get("/hotel-availability", hotelAvailability);

adminRoute.get("/users", allUsers);

adminRoute.get("/users/:id", singleUser);

adminRoute.put("/users/:id", updateUser);

adminRoute.delete("/users/:id", deleteUser);

adminRoute.post("/hotels/:hotelId/rooms", upload.array("images", 10), addRoom);

adminRoute.get("/hotels/:hotelId/rooms", getHotelRooms);

adminRoute.get("/rooms/:id", getRoom);

adminRoute.put("/rooms/:id", upload.array("images", 10), editRoom);

adminRoute.delete(
  "/rooms/:id",

  removeRoom,
);

adminRoute.delete("/rooms/:id/images/:imageId", removeRoomImage);
export default adminRoute;
