import cloudinary from "../config/cloudinary.js";

import {
  createRoom,
  getRoomsByHotelId,
  getRoomById,
  updateRoom,
  deleteRoom,
  countRoomsByHotelId,
  addRoomImage,
  getRoomImages,
  deleteRoomImage,
  getRoomsWithAvailability,
} from "../models/room.model.js";

const addRoom = async (req, res) => {
  try {
    // hotelId URL मधून येईल
    const { hotelId } = req.params;

    const {
      roomNumber,
      roomType,
      pricePerNight,
      capacity,
      bedType,
      roomSize,
      description,
      status,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !hotelId ||
      !roomNumber ||
      !roomType ||
      pricePerNight === undefined ||
      capacity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Required room fields are missing",
      });
    }

    // =================================================
    // CREATE ROOM
    // =================================================

    const room = await createRoom({
      hotelId,
      roomNumber,
      roomType,
      pricePerNight,
      capacity,
      bedType,
      roomSize,
      description,
      status,
    });

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        await addRoomImage(room.id, file.path, file.filename);
      }
    }
    // =================================================
    // CALCULATE TOTAL ROOMS
    // =================================================

    const totalRooms = await countRoomsByHotelId(hotelId);

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,
      message: "Room created successfully",

      room,

      totalRooms,
    });
  } catch (error) {
    console.log("Add room controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create room",
    });
  }
};

const getHotelRooms = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const { checkIn, checkOut } = req.query;

    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
      });
    }

    const rooms = await getRoomsWithAvailability(
      hotelId,
      checkIn || null,
      checkOut || null
    );

    for (const room of rooms) {
      room.images = await getRoomImages(room.id);

      room.is_booked = Boolean(room.is_booked);
      room.room_available = Boolean(room.room_available);
    }

    const totalRooms =
      await countRoomsByHotelId(hotelId);

    return res.status(200).json({
      success: true,
      count: rooms.length,
      totalRooms,
      rooms,
    });
  } catch (error) {
    console.log(
      "Get hotel rooms controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get hotel rooms",
    });
  }
};


const getRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await getRoomById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }
room.images = await getRoomImages(id);
    return res.status(200).json({
      success: true,

      room,
    });
  } catch (error) {
    console.log("Get room controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get room",
    });
  }
};


const editRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Check room exists
    const room = await getRoomById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Update room details
    const updated = await updateRoom(id, req.body);

    // Add new room images
    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        await addRoomImage(
          id,
          file.path,
          file.filename
        );
      }
    }

    // If neither room data nor images were provided
    if (
      !updated &&
      (!Array.isArray(req.files) || req.files.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "No room fields or images to update",
      });
    }

    // Get updated room
    const updatedRoom = await getRoomById(id);

    // Attach images
    updatedRoom.images = await getRoomImages(id);

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error) {
    console.log("Update room controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update room",
    });
  }
};

const removeRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Check room exists
    const room = await getRoomById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Get room images before deleting room
    const images = await getRoomImages(id);

    // Delete images from Cloudinary
    for (const image of images) {
      if (image.public_id) {
        await cloudinary.uploader.destroy(
          image.public_id
        );
      }
    }

    // Delete room
    const deleted = await deleteRoom(id);

    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: "Failed to delete room",
      });
    }

    // Recalculate total rooms
    const totalRooms =
      await countRoomsByHotelId(room.hotel_id);

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully",
      totalRooms,
    });
  } catch (error) {
    console.log("Delete room controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete room",
    });
  }
};

const removeRoomImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const room = await getRoomById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const images = await getRoomImages(id);

    const image = images.find(
      (item) => Number(item.id) === Number(imageId)
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    if (image.public_id) {
      await cloudinary.uploader.destroy(
        image.public_id
      );
    }

    const deleted = await deleteRoomImage(imageId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Image could not be deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Room image deleted successfully",
    });
  } catch (error) {
    console.log(
      "Remove room image controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete room image",
    });
  }
};

export { addRoom, getHotelRooms, getRoom, editRoom, removeRoom , removeRoomImage};
