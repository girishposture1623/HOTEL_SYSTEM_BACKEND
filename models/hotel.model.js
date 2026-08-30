import db from "../config/db.js";



const getHotels = async ({
  search = "",
  location = "",
  minPrice,
  maxPrice,
  minRating,
  sort = "newest",
  page = 1,
  limit = 10,
} = {}) => {
  try {
    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];

    // ================= SEARCH =================

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

    // ================= LOCATION =================

    if (location && location.trim()) {
      conditions.push(
        "LOWER(location) LIKE LOWER(?)"
      );

      values.push(
        `%${location.trim()}%`
      );
    }

    // ================= MIN PRICE =================

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
          "price_per_night >= ?"
        );

        values.push(price);
      }
    }

    // ================= MAX PRICE =================

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
          "price_per_night <= ?"
        );

        values.push(price);
      }
    }

    // ================= RATING =================

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
          "rating >= ?"
        );

        values.push(rating);
      }
    }

    // ================= WHERE =================

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // ================= SORT =================

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

    // ================= DEBUG =================

    console.log(
      "SEARCH VALUE:",
      search
    );

    console.log(
      "CONDITIONS:",
      conditions
    );

    console.log(
      "VALUES:",
      values
    );

    // ================= COUNT =================

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
      Number(countRows[0].total) || 0;

    // ================= GET HOTELS =================

    const [hotels] =
      await db.execute(
        `
        SELECT
          id,
          name,
          location,
          description,
          rating,
          price_per_night,
          total_rooms,
          created_at
        FROM hotels
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
        `,
        [
          ...values,
          limit,
          offset,
        ]
      );

    // ================= DEBUG =================

    console.log(
      "DB HOTELS:",
      hotels
    );

    // ================= IMAGES + AMENITIES =================

    for (const hotel of hotels) {

      const [images] =
        await db.execute(
          `
          SELECT
            id,
            image_url,
            public_id
          FROM hotel_images
          WHERE hotel_id = ?
          `,
          [hotel.id]
        );

      const [amenities] =
        await db.execute(
          `
          SELECT amenity
          FROM hotel_amenities
          WHERE hotel_id = ?
          `,
          [hotel.id]
        );

      hotel.images =
        images.map((image) => ({
          id: image.id,
          url: image.image_url,
          public_id: image.public_id,
        }));

      hotel.amenities =
        amenities.map(
          (item) => item.amenity
        );
    }

    // ================= RETURN =================

    return {
      hotels,
      total,
      page,
      limit,
      totalPages:
        Math.ceil(total / limit),
    };

  } catch (error) {

    console.log(
      "Get hotels model error:",
      error
    );

    throw error;
  }
};


const getHotelById = async (id) => {
  try {

    const [rows] = await db.execute(
      `
      SELECT
        id,
        name,
        location,
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


    // Get images
    const [images] = await db.execute(
      `
      SELECT
        id,
        image_url,
        public_id
      FROM hotel_images
      WHERE hotel_id = ?
      `,
      [id]
    );


   
    const [amenities] = await db.execute(
      `
      SELECT amenity
      FROM hotel_amenities
      WHERE hotel_id = ?
      `,
      [id]
    );


    hotel.images = images.map((image) => ({
      id: image.id,
      url: image.image_url,
      public_id: image.public_id,
    }));


    hotel.amenities = amenities.map(
      (item) => item.amenity
    );


    return hotel;

  } catch (error) {
    console.log("Get hotel by ID model error:", error);
    throw error;
  }
};


const createHotel = async ({
  name,
  location,
  description,
  rating,
  pricePerNight,
  totalRooms,
}) => {
  try {

    const [result] = await db.execute(
      `
      INSERT INTO hotels
      (
        name,
        location,
        description,
        rating,
        price_per_night,
        total_rooms
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        location,
        description,
        rating || 0,
        pricePerNight,
        totalRooms,
      ]
    );

    return {
      id: result.insertId,
      name,
      location,
      description,
      rating: rating || 0,
      pricePerNight,
      totalRooms,
    };

  } catch (error) {
    console.log("Create hotel model error:", error);
    throw error;
  }
};


const addHotelImage = async (
  hotelId,
  imageUrl,
  publicId = null
) => {
  try {

    const [result] = await db.execute(
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
    console.log("Add hotel image model error:", error);
    throw error;
  }
};


const addHotelAmenity = async (
  hotelId,
  amenity
) => {
  try {

    const [result] = await db.execute(
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


const updateHotel = async (id, data) => {
  try {
    const fieldMap = {
      name: "name",
      location: "location",
      description: "description",
      rating: "rating",
      pricePerNight: "price_per_night",
      totalRooms: "total_rooms",
    };

    const fields = [];
    const values = [];

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

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result] = await db.execute(
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


const deleteHotel = async (id) => {
  try {

    const [result] = await db.execute(
      `
      DELETE FROM hotels
      WHERE id = ?
      `,
      [id]
    );

    return result.affectedRows > 0;

  } catch (error) {
    console.log("Delete hotel model error:", error);
    throw error;
  }
};


const searchHotels = async (search) => {
  try {

    const [hotels] = await db.execute(
      `
      SELECT
        id,
        name,
        location,
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


    for (const hotel of hotels) {

      const [images] = await db.execute(
        `
        SELECT
          id,
          image_url,
          public_id
        FROM hotel_images
        WHERE hotel_id = ?
        `,
        [hotel.id]
      );


      const [amenities] = await db.execute(
        `
        SELECT amenity
        FROM hotel_amenities
        WHERE hotel_id = ?
        `,
        [hotel.id]
      );


      hotel.images = images.map((image) => ({
        id: image.id,
        url: image.image_url,
        public_id: image.public_id,
      }));


      hotel.amenities = amenities.map(
        (item) => item.amenity
      );
    }


    return hotels;

  } catch (error) {
    console.log("Search hotels model error:", error);
    throw error;
  }
};

export {
  getHotels,
  getHotelById,
  createHotel,
  addHotelImage,
  addHotelAmenity,
  updateHotel,
  deleteHotel,
  searchHotels,
};