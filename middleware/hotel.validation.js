import { body } from "express-validator";

const createHotelValidation = [

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Hotel name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Hotel name must be between 2 and 100 characters"
    ),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 2, max: 150 })
    .withMessage(
      "Location must be between 2 and 150 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Description cannot exceed 1000 characters"
    ),

  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage(
      "Rating must be between 0 and 5"
    ),

  body("pricePerNight")
    .notEmpty()
    .withMessage(
      "Price per night is required"
    )
    .isFloat({ min: 0 })
    .withMessage(
      "Price must be a positive number"
    ),

  body("totalRooms")
    .notEmpty()
    .withMessage(
      "Total rooms are required"
    )
    .isInt({ min: 1 })
    .withMessage(
      "Total rooms must be at least 1"
    ),

  // =====================================================
  // IMAGES
  // =====================================================

  body("images")
    .optional(),

  // =====================================================
  // AMENITIES
  // =====================================================

  body("amenities")
    .optional()
    .custom((value) => {

      // FormData मधून JSON string येते
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);

          if (!Array.isArray(parsed)) {
            throw new Error();
          }

          return true;

        } catch (error) {
          throw new Error(
            "Amenities must be an array"
          );
        }
      }

      // जर normal JSON request असेल
      if (Array.isArray(value)) {
        return true;
      }

      throw new Error(
        "Amenities must be an array"
      );
    }),

];


// =========================================================
// UPDATE HOTEL VALIDATION
// =========================================================

const updateHotelValidation = [

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Hotel name must be between 2 and 100 characters"
    ),

  body("location")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage(
      "Location must be between 2 and 150 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Description cannot exceed 1000 characters"
    ),

  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage(
      "Rating must be between 0 and 5"
    ),

  body("pricePerNight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      "Price must be a positive number"
    ),

  body("totalRooms")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Total rooms must be at least 1"
    ),

  body("amenities")
    .optional()
    .custom((value) => {

      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);

          if (!Array.isArray(parsed)) {
            throw new Error();
          }

          return true;

        } catch (error) {
          throw new Error(
            "Amenities must be an array"
          );
        }
      }

      if (Array.isArray(value)) {
        return true;
      }

      throw new Error(
        "Amenities must be an array"
      );
    }),

];

export {
  createHotelValidation,
  updateHotelValidation,
};