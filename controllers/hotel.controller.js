import {
  addHotelAmenity,
  addHotelImage,
  createHotel,
  deleteHotel,
  getHotelById,
  getHotels,
  searchHotels,
  updateHotel,
} from "../models/hotel.model.js";

const getAllHotels = async (req, res) => {
  try {
    const {
      search,
      location,
      minPrice,
      maxPrice,
      minRating,
      sort,
      page,
      limit,
    } = req.query;

    const result = await getHotels({
      search,
      location,
      minPrice,
      maxPrice,
      minRating,
      sort,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      count: result.hotels.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hotels: result.hotels,
    });
  } catch (error) {
    console.log("Get hotels controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Get hotels controller error",
      error: error.message,
    });
  }
};

const getHotelid = async (req, res) => {
  try {
    const hotel = await getHotelById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }
    return res.status(200).json({
      success: true,
      hotel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "get hotel id eror",
      error,
    });
  }
};

const searchHotel = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || !search.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search destination is required",
      });
    }

    const hotels = await searchHotels(search.trim());

    if (hotels.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      count: hotels.length,
      hotels,
    });

  } catch (error) {
    console.log("Search hotel controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Search hotel error",
      error: error.message,
    });
  }
};

const postHotel = async (req, res) => {
  try {
    const {
      name,
      location,
      description,
      rating,
      pricePerNight,
      totalRooms,
      images,
      amenities,
    } = req.body;

    if (!name || !location || !pricePerNight || !totalRooms) {
      return res.status(400).json({
        success: false,
        message: "Name, location, price and total rooms are required",
      });
    }

    const hotel = await createHotel({
      name,
      location,
      description,
      rating,
      pricePerNight,
      totalRooms,
    });

    if (Array.isArray(images)) {
      for (const image of images) {
        await addHotelImage(hotel.id, image.url, image.public_id || null);
      }
    }

    if (Array.isArray(amenities)) {
      for (const amenity of amenities) {
        await addHotelAmenity(hotel.id, amenity);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Hotel creayed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Faild to create hotel",
    });
  }
};

const putHotel = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await updateHotel(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found or no fields to update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
    });
  } catch (error) {
    console.log("Update hotel controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update hotel",
    });
  }
};

const removeHotel = async (req, res) => {
  try {
    const hotel = await deleteHotel(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Hotel deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Fail to delet hotel",
    });
  }
};

export {
  getAllHotels,
  getHotelid,
  searchHotel,
  postHotel,
  putHotel,
  removeHotel,
};
