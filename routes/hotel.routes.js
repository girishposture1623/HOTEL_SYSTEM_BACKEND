import express from "express";

import {
  getAllHotels,
  searchHotel,
  getHotelid,
} from "../controllers/hotel.controller.js";

const hotelRoute = express.Router();

hotelRoute.get("/hotels", getAllHotels);

hotelRoute.get("/hotels/:id", getHotelid);

hotelRoute.post("/hotels/search", searchHotel);


export default hotelRoute;