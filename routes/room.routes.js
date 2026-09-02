import express from "express";

import {
  addRoom,
  getHotelRooms,
  getRoom,
  editRoom,
  removeRoom,
} from "../controllers/room.controller.js";

import AdminRoute from "../middleware/AdminRoute.js";

const router = express.Router();


router.post(
  "/",
  AdminRoute,
  addRoom
);


router.get(
  "/hotel/:hotelId",
  getHotelRooms
);


router.get(
  "/:id",
  getRoom
);


router.put(
  "/:id",
  AdminRoute,
  editRoom
);


router.delete(
  "/:id",
  AdminRoute,
  removeRoom
);


export default router;