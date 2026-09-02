import db from "../config/db.js";

// =====================================================
// CREATE ROOM
// =====================================================

const createRoom = async ({
  hotelId,
  roomNumber,
  roomType,
  pricePerNight,
  capacity,
  bedType,
  roomSize,
  description,
  status = "available",
}) => {
  try {
    const [result] = await db.execute(
      `
      INSERT INTO rooms
      (
        hotel_id,
        room_number,
        room_type,
        price_per_night,
        capacity,
        bed_type,
        room_size,
        description,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        hotelId,
        roomNumber,
        roomType,
        pricePerNight,
        capacity,
        bedType || null,
        roomSize || null,
        description || null,
        status,
      ]
    );

    return {
      id: result.insertId,
      hotelId,
      roomNumber,
      roomType,
      pricePerNight,
      capacity,
      bedType: bedType || null,
      roomSize: roomSize || null,
      description: description || null,
      status,
    };
  } catch (error) {
    console.log("Create room model error:", error);
    throw error;
  }
};


// =====================================================
// GET ALL ROOMS OF HOTEL
// =====================================================

const getRoomsByHotelId = async (hotelId) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        id,
        hotel_id,
        room_number,
        room_type,
        price_per_night,
        capacity,
        bed_type,
        room_size,
        description,
        status,
        created_at,
        updated_at
      FROM rooms
      WHERE hotel_id = ?
      ORDER BY room_number ASC
      `,
      [hotelId]
    );

    return rows;
  } catch (error) {
    console.log("Get hotel rooms model error:", error);
    throw error;
  }
};

// =====================================================
// GET ROOMS WITH DATE-WISE AVAILABILITY
// =====================================================

const getRoomsWithAvailability = async (
  hotelId,
  checkIn = null,
  checkOut = null
) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        r.id,
        r.hotel_id,
        r.room_number,
        r.room_type,
        r.price_per_night,
        r.capacity,
        r.bed_type,
        r.room_size,
        r.description,
        r.status,
        r.created_at,
        r.updated_at,

        CASE
          WHEN r.status <> 'available' THEN 0

          WHEN ? IS NULL OR ? IS NULL THEN 1

          WHEN EXISTS (
            SELECT 1
            FROM bookings b
            WHERE b.room_id = r.id
              AND (
                b.booking_status = 'confirmed'
                OR (
                  b.booking_status = 'pending'
                  AND b.payment_status = 'pending'
                  AND b.expires_at IS NOT NULL
                  AND b.expires_at > NOW()
                )
              )
              AND b.check_in < ?
              AND b.check_out > ?
          )
          THEN 0

          ELSE 1
        END AS room_available,

        CASE
          WHEN r.status <> 'available' THEN 0

          WHEN ? IS NULL OR ? IS NULL THEN 0

          WHEN EXISTS (
            SELECT 1
            FROM bookings b
            WHERE b.room_id = r.id
              AND (
                b.booking_status = 'confirmed'
                OR (
                  b.booking_status = 'pending'
                  AND b.payment_status = 'pending'
                  AND b.expires_at IS NOT NULL
                  AND b.expires_at > NOW()
                )
              )
              AND b.check_in < ?
              AND b.check_out > ?
          )
          THEN 1

          ELSE 0
        END AS is_booked

      FROM rooms r
      WHERE r.hotel_id = ?
      ORDER BY r.room_number ASC
      `,
      [
        checkIn,
        checkOut,
        checkOut,
        checkIn,

        checkIn,
        checkOut,
        checkOut,
        checkIn,

        hotelId,
      ]
    );

    return rows;
  } catch (error) {
    console.log(
      "Get rooms with availability model error:",
      error
    );

    throw error;
  }
};
// =====================================================
// GET ROOM BY ID
// =====================================================

const getRoomById = async (id) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        id,
        hotel_id,
        room_number,
        room_type,
        price_per_night,
        capacity,
        bed_type,
        room_size,
        description,
        status,
        created_at,
        updated_at
      FROM rooms
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0] || null;
  } catch (error) {
    console.log("Get room by ID model error:", error);
    throw error;
  }
};


// =====================================================
// UPDATE ROOM
// =====================================================

const updateRoom = async (id, data) => {
  try {
    const fieldMap = {
      roomNumber: "room_number",
      roomType: "room_type",
      pricePerNight: "price_per_night",
      capacity: "capacity",
      bedType: "bed_type",
      roomSize: "room_size",
      description: "description",
      status: "status",
    };

    const fields = [];
    const values = [];

    for (const key in data) {
      if (
        data[key] !== undefined &&
        fieldMap[key]
      ) {
        fields.push(`${fieldMap[key]} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await db.execute(
      `
      UPDATE rooms
      SET ${fields.join(", ")}
      WHERE id = ?
      `,
      values
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log("Update room model error:", error);
    throw error;
  }
};


// =====================================================
// DELETE ROOM
// =====================================================

const deleteRoom = async (id) => {
  try {
    const [result] = await db.execute(
      `
      DELETE FROM rooms
      WHERE id = ?
      `,
      [id]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log("Delete room model error:", error);
    throw error;
  }
};


// =====================================================
// COUNT ROOMS OF HOTEL
// =====================================================

const countRoomsByHotelId = async (hotelId) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT COUNT(*) AS total_rooms
      FROM rooms
      WHERE hotel_id = ?
      `,
      [hotelId]
    );

    return Number(rows[0]?.total_rooms) || 0;
  } catch (error) {
    console.log("Count hotel rooms model error:", error);
    throw error;
  }
};

const addRoomImage = async (roomId, imageUrl, publicId) => {
  try {
    const [result] = await db.execute(
      `
      INSERT INTO room_images
      (room_id, image_url, public_id)
      VALUES (?, ?, ?)
      `,
      [roomId, imageUrl, publicId]
    );

    return {
      id: result.insertId,
      roomId,
      imageUrl,
      publicId,
    };
  } catch (error) {
    console.log("Add room image model error:", error);
    throw error;
  }
};


const getRoomImages = async (roomId) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        id,
        room_id,
        image_url,
        public_id,
        created_at
      FROM room_images
      WHERE room_id = ?
      ORDER BY id ASC
      `,
      [roomId]
    );

    return rows;
  } catch (error) {
    console.log("Get room images model error:", error);
    throw error;
  }
};


const deleteRoomImage = async (imageId) => {
  try {
    const [result] = await db.execute(
      `
      DELETE FROM room_images
      WHERE id = ?
      `,
      [imageId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log("Delete room image model error:", error);
    throw error;
  }
};
export {
  createRoom,
  getRoomsByHotelId,
  getRoomById,
  updateRoom,
  deleteRoom,
  countRoomsByHotelId,
  addRoomImage,
  getRoomImages,
  deleteRoomImage,
  getRoomsWithAvailability
};