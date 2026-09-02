import express from "express";

import {
  getAllHotels,
  searchHotel,
  getHotelid,
} from "../controllers/hotel.controller.js";
import { getHotelRooms } from "../controllers/room.controller.js";

const hotelRoute = express.Router();

hotelRoute.get("/hotels", getAllHotels);

hotelRoute.get("/hotels/:id", getHotelid);

hotelRoute.post("/hotels/search", searchHotel);
hotelRoute.get("/hotels/:hotelId/rooms", getHotelRooms);


export default hotelRoute;