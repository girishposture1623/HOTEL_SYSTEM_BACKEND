import {
  addHotelAmenity,
  addHotelImage,
  createHotel,
  deleteHotel,
  deleteHotelAmenities,
  deleteHotelImage,
  getHotelById,
  getHotelImageById,
  getHotels,
  searchHotels,
  updateHotel,
} from "../models/hotel.model.js";

import cloudinary from "../config/cloudinary.js";


// =====================================================
// GET ALL HOTELS
// =====================================================

const getAllHotels = async (req, res) => {
  try {
    const {
      search = "",
      location = "",
      minPrice,
      maxPrice,
      minRating,
      sort = "newest",
    } = req.query;

    const result = await getHotels({
      search,
      location,
      minPrice,
      maxPrice,
      minRating,
      sort,
    });

    return res.status(200).json({
      success: true,
      count: result.total,
      hotels: result.hotels,
    });

  } catch (error) {
    console.log(
      "Get all hotels controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get hotels",
    });
  }
};



const getHotelid = async (req, res) => {
  try {
    const hotel = await getHotelById(
      req.params.id
    );

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
    console.log(
      "Get hotel by ID controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get hotel",
    });
  }
};


// =====================================================
// SEARCH HOTEL
// =====================================================

const searchHotel = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || !search.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search destination is required",
      });
    }

    const hotels = await searchHotels(
      search.trim()
    );

    /*
      Search result empty असला तरी
      404 देण्याऐवजी empty array return करणे better आहे.
    */

    return res.status(200).json({
      success: true,
      count: hotels.length,
      hotels,
    });

  } catch (error) {
    console.log(
      "Search hotel controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Search hotel error",
      error: error.message,
    });
  }
};


// =====================================================
// CREATE HOTEL
// =====================================================

const postHotel = async (req, res) => {
  try {

    const {
      name,
      location,
      phoneNumber,
      callStatus,
      description,
      rating,
      pricePerNight,
      totalRooms,
      amenities,
    } = req.body;


    // =================================================
    // REQUIRED FIELDS
    // =================================================

    if (
      !name ||
      !location ||
      !pricePerNight ||
      !totalRooms
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, location, price and total rooms are required",
      });
    }


    // =================================================
    // VALIDATE PHONE NUMBER
    // =================================================

    if (
      phoneNumber !== undefined &&
      phoneNumber !== null &&
      String(phoneNumber).trim() !== ""
    ) {
      const cleanPhone =
        String(phoneNumber)
          .replace(/\s+/g, "")
          .replace(/-/g, "");

      if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number must contain 10 to 15 digits",
        });
      }
    }


    // =================================================
    // VALIDATE CALL STATUS
    // =================================================

    const validCallStatuses = [
      "available",
      "busy",
    ];

    const finalCallStatus =
      callStatus || "available";

    if (
      !validCallStatuses.includes(
        finalCallStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Call status must be available or busy",
      });
    }


    // =================================================
    // CREATE HOTEL
    // =================================================

    const hotel = await createHotel({
      name,
      location,
      phoneNumber:
        phoneNumber
          ? String(phoneNumber).trim()
          : null,
      callStatus:
        finalCallStatus,
      description,
      rating,
      pricePerNight,
      totalRooms,
    });


    // =================================================
    // ADD IMAGES
    // =================================================

    if (
      Array.isArray(req.files) &&
      req.files.length > 0
    ) {

      for (const file of req.files) {

        await addHotelImage(
          hotel.id,
          file.path,
          file.filename
        );

      }
    }


    // =================================================
    // AMENITIES
    // =================================================

    let amenityList = [];


    if (Array.isArray(amenities)) {

      amenityList = amenities;

    } else if (
      typeof amenities === "string"
    ) {

      try {

        const parsed =
          JSON.parse(amenities);

        if (Array.isArray(parsed)) {
          amenityList = parsed;
        }

      } catch {

        amenityList =
          amenities
            .split(",")
            .map(
              (item) => item.trim()
            )
            .filter(Boolean);
      }
    }


    // =================================================
    // ADD AMENITIES
    // =================================================

    for (const amenity of amenityList) {

      if (
        typeof amenity === "string" &&
        amenity.trim()
      ) {

        await addHotelAmenity(
          hotel.id,
          amenity.trim()
        );

      }
    }


    // =================================================
    // SUCCESS
    // =================================================

    return res.status(201).json({
      success: true,
      message: "Hotel created successfully",

      hotel: {
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
        phoneNumber:
          hotel.phoneNumber,
        callStatus:
          hotel.callStatus,
      },
    });

  } catch (error) {

    console.log(
      "Create hotel controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create hotel",
    });
  }
};


// =====================================================
// UPDATE HOTEL
// =====================================================

const putHotel = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      name,
      location,
      phoneNumber,
      callStatus,
      description,
      rating,
      pricePerNight,
      totalRooms,
      amenities,
    } = req.body;


    // =================================================
    // CHECK HOTEL
    // =================================================

    const existingHotel =
      await getHotelById(id);

    if (!existingHotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }


    // =================================================
    // VALIDATE PHONE NUMBER
    // =================================================

    if (
      phoneNumber !== undefined &&
      phoneNumber !== null &&
      String(phoneNumber).trim() !== ""
    ) {

      const cleanPhone =
        String(phoneNumber)
          .replace(/\s+/g, "")
          .replace(/-/g, "");

      if (
        !/^\+?[0-9]{10,15}$/.test(
          cleanPhone
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number must contain 10 to 15 digits",
        });
      }
    }


    // =================================================
    // VALIDATE CALL STATUS
    // =================================================

    if (
      callStatus !== undefined &&
      callStatus !== null &&
      !["available", "busy"].includes(
        callStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Call status must be available or busy",
      });
    }


    // =================================================
    // UPDATE HOTEL DETAILS
    // =================================================

    const updated =
      await updateHotel(id, {

        ...(name !== undefined && {
          name,
        }),

        ...(location !== undefined && {
          location,
        }),

        ...(phoneNumber !== undefined && {
          phoneNumber:
            String(phoneNumber).trim() ||
            null,
        }),

        ...(callStatus !== undefined && {
          callStatus,
        }),

        ...(description !== undefined && {
          description,
        }),

        ...(rating !== undefined && {
          rating,
        }),

        ...(pricePerNight !== undefined && {
          pricePerNight,
        }),

        ...(totalRooms !== undefined && {
          totalRooms,
        }),

      });


    // =================================================
    // UPDATE AMENITIES
    // =================================================

    let amenityList = [];


    if (Array.isArray(amenities)) {

      amenityList = amenities;

    } else if (
      typeof amenities === "string"
    ) {

      try {

        const parsed =
          JSON.parse(amenities);

        if (Array.isArray(parsed)) {
          amenityList = parsed;
        }

      } catch {

        amenityList =
          amenities
            .split(",")
            .map(
              (item) => item.trim()
            )
            .filter(Boolean);
      }
    }


    /*
      जर amenities field request मध्ये आली असेल
      तरच जुने amenities delete करून नवीन add करायचे.
    */

    if (
      amenities !== undefined
    ) {

      await deleteHotelAmenities(id);


      for (const amenity of amenityList) {

        if (
          typeof amenity === "string" &&
          amenity.trim()
        ) {

          await addHotelAmenity(
            id,
            amenity.trim()
          );

        }
      }
    }


    // =================================================
    // ADD NEW IMAGES
    // =================================================

    if (
      Array.isArray(req.files) &&
      req.files.length > 0
    ) {

      for (const file of req.files) {

        await addHotelImage(
          id,
          file.path,
          file.filename
        );

      }
    }


    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
    });

  } catch (error) {

    console.log(
      "Update hotel controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update hotel",
    });
  }
};


// =====================================================
// DELETE HOTEL
// =====================================================

const removeHotel = async (req, res) => {
  try {

    const hotel =
      await deleteHotel(
        req.params.id
      );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Hotel deleted successfully",
    });

  } catch (error) {

    console.log(
      "Delete hotel controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete hotel",
    });
  }
};


// =====================================================
// DELETE HOTEL IMAGE
// =====================================================

const removeHotelImage = async (
  req,
  res
) => {
  try {

    const {
      id,
      imageId,
    } = req.params;


    // =================================================
    // GET IMAGE
    // =================================================

    const image =
      await getHotelImageById(
        imageId
      );


    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }


    // =================================================
    // CHECK IMAGE HOTEL
    // =================================================

    if (
      Number(image.hotel_id) !==
      Number(id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This image does not belong to this hotel",
      });
    }


    // =================================================
    // DELETE CLOUDINARY IMAGE
    // =================================================

    if (image.public_id) {

      await cloudinary.uploader.destroy(
        image.public_id
      );

    }


    // =================================================
    // DELETE DATABASE IMAGE
    // =================================================

    const deleted =
      await deleteHotelImage(
        imageId
      );


    if (!deleted) {
      return res.status(404).json({
        success: false,
        message:
          "Image could not be deleted",
      });
    }


    return res.status(200).json({
      success: true,
      message:
        "Hotel image deleted successfully",
    });

  } catch (error) {

    console.log(
      "Remove hotel image controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete hotel image",
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

export {
  getAllHotels,
  getHotelid,
  searchHotel,
  postHotel,
  putHotel,
  removeHotel,
  removeHotelImage,
};