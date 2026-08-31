import db from "../config/db.js";

// =====================================================
// GET HOTELS
// =====================================================

const getHotels = async ({
  search = "",
  location = "",
  minPrice,
  maxPrice,
  minRating,
  sort = "newest",
} = {}) => {
  try {
    // =====================================================
    // CONDITIONS
    // =====================================================

    const conditions = [];
    const values = [];

    // =====================================================
    // SEARCH
    // =====================================================

    if (search && search.trim()) {
      conditions.push(`
        (
          LOWER(name) LIKE LOWER(?)
          OR LOWER(location) LIKE LOWER(?)
          OR LOWER(description) LIKE LOWER(?)
        )
      `);

      const searchValue = `%${search.trim()}%`;

      values.push(
        searchValue,
        searchValue,
        searchValue
      );
    }

    // =====================================================
    // LOCATION
    // =====================================================

    if (location && location.trim()) {
      conditions.push(
        `LOWER(location) LIKE LOWER(?)`
      );

      values.push(
        `%${location.trim()}%`
      );
    }

    // =====================================================
    // MIN PRICE
    // =====================================================

    if (
      minPrice !== undefined &&
      minPrice !== ""
    ) {
      const price = Number(minPrice);

      if (
        !Number.isNaN(price) &&
        price >= 0
      ) {
        conditions.push(
          `price_per_night >= ?`
        );

        values.push(price);
      }
    }

    // =====================================================
    // MAX PRICE
    // =====================================================

    if (
      maxPrice !== undefined &&
      maxPrice !== ""
    ) {
      const price = Number(maxPrice);

      if (
        !Number.isNaN(price) &&
        price >= 0
      ) {
        conditions.push(
          `price_per_night <= ?`
        );

        values.push(price);
      }
    }

    // =====================================================
    // MIN RATING
    // =====================================================

    if (
      minRating !== undefined &&
      minRating !== ""
    ) {
      const rating = Number(minRating);

      if (
        !Number.isNaN(rating) &&
        rating >= 0 &&
        rating <= 5
      ) {
        conditions.push(
          `rating >= ?`
        );

        values.push(rating);
      }
    }

    // =====================================================
    // WHERE
    // =====================================================

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // =====================================================
    // SORT
    // =====================================================

    const sortMap = {
      newest: "created_at DESC",
      oldest: "created_at ASC",
      price_asc: "price_per_night ASC",
      price_desc: "price_per_night DESC",
      rating_desc: "rating DESC",
      rating_asc: "rating ASC",
      name_asc: "name ASC",
      name_desc: "name DESC",
    };

    const orderBy =
      sortMap[sort] ||
      sortMap.newest;

    // =====================================================
    // COUNT
    // =====================================================

    const [countRows] =
      await db.execute(
        `
        SELECT COUNT(*) AS total
        FROM hotels
        ${whereClause}
        `,
        values
      );

    const total =
      Number(countRows[0]?.total) || 0;

    // =====================================================
    // GET ALL MATCHING HOTELS
    // =====================================================

    const [hotels] =
      await db.execute(
        `
        SELECT
          id,
          name,
          location,
          phone_number,
          call_status,
          description,
          rating,
          price_per_night,
          total_rooms,
          created_at
        FROM hotels
        ${whereClause}
        ORDER BY ${orderBy}
        `,
        values
      );

    // =====================================================
    // GET IMAGES + AMENITIES
    // =====================================================

    for (const hotel of hotels) {

      // ---------------------------------------------------
      // IMAGES
      // ---------------------------------------------------

      const [images] =
        await db.execute(
          `
          SELECT
            id,
            image_url,
            public_id
          FROM hotel_images
          WHERE hotel_id = ?
          ORDER BY id ASC
          `,
          [hotel.id]
        );

      // ---------------------------------------------------
      // AMENITIES
      // ---------------------------------------------------

      const [amenities] =
        await db.execute(
          `
          SELECT
            id,
            amenity
          FROM hotel_amenities
          WHERE hotel_id = ?
          ORDER BY id ASC
          `,
          [hotel.id]
        );

      // ---------------------------------------------------
      // FORMAT IMAGES
      // ---------------------------------------------------

      hotel.images =
        images.map((image) => ({
          id: image.id,
          url: image.image_url,
          public_id: image.public_id,
        }));

      // ---------------------------------------------------
      // FORMAT AMENITIES
      // ---------------------------------------------------

      hotel.amenities =
        amenities.map(
          (item) => item.amenity
        );
    }

    // =====================================================
    // RETURN
    // =====================================================

    return {
      hotels,
      total,
    };

  } catch (error) {

    console.log(
      "Get hotels model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// GET HOTEL BY ID
// =====================================================

const getHotelById = async (id) => {
  try {

    const [rows] =
      await db.execute(
        `
        SELECT
          id,
          name,
          location,
          phone_number,
          call_status,
          description,
          rating,
          price_per_night,
          total_rooms,
          created_at
        FROM hotels
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

    if (rows.length === 0) {
      return null;
    }

    const hotel = rows[0];

    // =====================================================
    // GET IMAGES
    // =====================================================

    const [images] =
      await db.execute(
        `
        SELECT
          id,
          image_url,
          public_id
        FROM hotel_images
        WHERE hotel_id = ?
        ORDER BY id ASC
        `,
        [id]
      );

    // =====================================================
    // GET AMENITIES
    // =====================================================

    const [amenities] =
      await db.execute(
        `
        SELECT
          amenity
        FROM hotel_amenities
        WHERE hotel_id = ?
        ORDER BY id ASC
        `,
        [id]
      );

    // =====================================================
    // FORMAT IMAGES
    // =====================================================

    hotel.images =
      images.map((image) => ({
        id: image.id,
        url: image.image_url,
        public_id: image.public_id,
      }));

    // =====================================================
    // FORMAT AMENITIES
    // =====================================================

    hotel.amenities =
      amenities.map(
        (item) => item.amenity
      );

    return hotel;

  } catch (error) {

    console.log(
      "Get hotel by ID model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// CREATE HOTEL
// =====================================================

const createHotel = async ({
  name,
  location,
  phoneNumber,
  callStatus = "available",
  description,
  rating,
  pricePerNight,
  totalRooms,
}) => {
  try {

    // =====================================================
    // INSERT HOTEL
    // =====================================================

    const [result] =
      await db.execute(
        `
        INSERT INTO hotels
        (
          name,
          location,
          phone_number,
          call_status,
          description,
          rating,
          price_per_night,
          total_rooms
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name,
          location,
          phoneNumber || null,
          callStatus || "available",
          description || null,
          rating || 0,
          pricePerNight,
          totalRooms,
        ]
      );

    // =====================================================
    // RETURN
    // =====================================================

    return {
      id: result.insertId,
      name,
      location,
      phoneNumber: phoneNumber || null,
      callStatus: callStatus || "available",
      description: description || null,
      rating: rating || 0,
      pricePerNight,
      totalRooms,
    };

  } catch (error) {

    console.log(
      "Create hotel model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// ADD HOTEL IMAGE
// =====================================================

const addHotelImage = async (
  hotelId,
  imageUrl,
  publicId = null
) => {
  try {

    const [result] =
      await db.execute(
        `
        INSERT INTO hotel_images
        (
          hotel_id,
          image_url,
          public_id
        )
        VALUES (?, ?, ?)
        `,
        [
          hotelId,
          imageUrl,
          publicId,
        ]
      );

    return result.insertId;

  } catch (error) {

    console.log(
      "Add hotel image model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// GET HOTEL IMAGE BY ID
// =====================================================

const getHotelImageById = async (
  imageId
) => {
  try {

    const [rows] =
      await db.execute(
        `
        SELECT
          id,
          hotel_id,
          image_url,
          public_id
        FROM hotel_images
        WHERE id = ?
        `,
        [imageId]
      );

    return rows[0] || null;

  } catch (error) {

    console.log(
      "Get hotel image model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// DELETE HOTEL IMAGE
// =====================================================

const deleteHotelImage = async (
  imageId
) => {
  try {

    const [result] =
      await db.execute(
        `
        DELETE FROM hotel_images
        WHERE id = ?
        `,
        [imageId]
      );

    return result.affectedRows > 0;

  } catch (error) {

    console.log(
      "Delete hotel image model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// ADD HOTEL AMENITY
// =====================================================

const addHotelAmenity = async (
  hotelId,
  amenity
) => {
  try {

    const [result] =
      await db.execute(
        `
        INSERT INTO hotel_amenities
        (
          hotel_id,
          amenity
        )
        VALUES (?, ?)
        `,
        [
          hotelId,
          amenity,
        ]
      );

    return result.insertId;

  } catch (error) {

    console.log(
      "Add hotel amenity model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// DELETE HOTEL AMENITIES
// =====================================================

const deleteHotelAmenities = async (
  hotelId
) => {
  try {

    const [result] =
      await db.execute(
        `
        DELETE FROM hotel_amenities
        WHERE hotel_id = ?
        `,
        [hotelId]
      );

    return result.affectedRows;

  } catch (error) {

    console.log(
      "Delete hotel amenities model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// UPDATE HOTEL
// =====================================================

const updateHotel = async (
  id,
  data
) => {
  try {

    // =====================================================
    // FIELD MAP
    // =====================================================

    const fieldMap = {
      name: "name",
      location: "location",
      phoneNumber: "phone_number",
      callStatus: "call_status",
      description: "description",
      rating: "rating",
      pricePerNight: "price_per_night",
      totalRooms: "total_rooms",
    };

    const fields = [];
    const values = [];

    // =====================================================
    // BUILD UPDATE QUERY
    // =====================================================

    for (const key in data) {

      if (
        data[key] !== undefined &&
        fieldMap[key]
      ) {
        fields.push(
          `${fieldMap[key]} = ?`
        );

        values.push(data[key]);
      }
    }

    // =====================================================
    // NO FIELDS
    // =====================================================

    if (fields.length === 0) {
      return false;
    }

    // =====================================================
    // HOTEL ID
    // =====================================================

    values.push(id);

    // =====================================================
    // UPDATE
    // =====================================================

    const [result] =
      await db.execute(
        `
        UPDATE hotels
        SET ${fields.join(", ")}
        WHERE id = ?
        `,
        values
      );

    return result.affectedRows > 0;

  } catch (error) {

    console.log(
      "Update hotel model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// DELETE HOTEL
// =====================================================

const deleteHotel = async (
  id
) => {
  try {

    const [result] =
      await db.execute(
        `
        DELETE FROM hotels
        WHERE id = ?
        `,
        [id]
      );

    return result.affectedRows > 0;

  } catch (error) {

    console.log(
      "Delete hotel model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// SEARCH HOTELS
// =====================================================

const searchHotels = async (
  search
) => {
  try {

    const [hotels] =
      await db.execute(
        `
        SELECT
          id,
          name,
          location,
          phone_number,
          call_status,
          description,
          rating,
          price_per_night,
          total_rooms
        FROM hotels
        WHERE
          name LIKE ?
          OR location LIKE ?
        ORDER BY rating DESC
        `,
        [
          `%${search}%`,
          `%${search}%`,
        ]
      );

    // =====================================================
    // IMAGES + AMENITIES
    // =====================================================

    for (const hotel of hotels) {

      // ---------------------------------------------------
      // IMAGES
      // ---------------------------------------------------

      const [images] =
        await db.execute(
          `
          SELECT
            id,
            image_url,
            public_id
          FROM hotel_images
          WHERE hotel_id = ?
          ORDER BY id ASC
          `,
          [hotel.id]
        );

      // ---------------------------------------------------
      // AMENITIES
      // ---------------------------------------------------

      const [amenities] =
        await db.execute(
          `
          SELECT
            amenity
          FROM hotel_amenities
          WHERE hotel_id = ?
          ORDER BY id ASC
          `,
          [hotel.id]
        );

      // ---------------------------------------------------
      // FORMAT IMAGES
      // ---------------------------------------------------

      hotel.images =
        images.map((image) => ({
          id: image.id,
          url: image.image_url,
          public_id: image.public_id,
        }));

      // ---------------------------------------------------
      // FORMAT AMENITIES
      // ---------------------------------------------------

      hotel.amenities =
        amenities.map(
          (item) => item.amenity
        );
    }

    return hotels;

  } catch (error) {

    console.log(
      "Search hotels model error:",
      error
    );

    throw error;
  }
};


// =====================================================
// EXPORT
// =====================================================

export {
  getHotels,
  getHotelById,
  createHotel,
  addHotelImage,
  addHotelAmenity,
  updateHotel,
  deleteHotel,
  searchHotels,
  deleteHotelAmenities,
  getHotelImageById,
  deleteHotelImage,
};