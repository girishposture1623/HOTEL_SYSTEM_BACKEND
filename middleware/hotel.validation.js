import { body } from "express-validator";

const createHotelValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Hotel name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Hotel name must be between 2 and 100 characters"),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Location must be between 2 and 150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5"),

  body("pricePerNight")
    .notEmpty()
    .withMessage("Price per night is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("totalRooms")
    .notEmpty()
    .withMessage("Total rooms are required")
    .isInt({ min: 1 })
    .withMessage("Total rooms must be at least 1"),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),

  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),
];

const updateHotelValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Hotel name must be between 2 and 100 characters"),

  body("location")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Location must be between 2 and 150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("rating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5"),

  body("pricePerNight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("totalRooms")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total rooms must be at least 1"),
];

export {
  createHotelValidation,
  updateHotelValidation,
};