import { body } from "express-validator";

const createBookingValidation = [
  body("hotelId")
    .notEmpty()
    .withMessage("Hotel ID is required")
    .isInt({ min: 1 })
    .withMessage("Hotel ID must be a valid number"),

  body("checkIn")
    .notEmpty()
    .withMessage("Check-in date is required")
    .isISO8601()
    .withMessage("Invalid check-in date"),

  body("checkOut")
    .notEmpty()
    .withMessage("Check-out date is required")
    .isISO8601()
    .withMessage("Invalid check-out date"),

  body("adults")
    .notEmpty()
    .withMessage("Adults count is required")
    .isInt({ min: 1 })
    .withMessage("Adults must be at least 1"),

  body("children")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Children must be 0 or greater"),

  body("rooms")
    .notEmpty()
    .withMessage("Rooms count is required")
    .isInt({ min: 1 })
    .withMessage("Rooms must be at least 1"),
];

const availabilityValidation = [
  body("hotelId")
    .notEmpty()
    .withMessage("Hotel ID is required")
    .isInt({ min: 1 })
    .withMessage("Hotel ID must be a valid number"),

  body("checkIn")
    .notEmpty()
    .withMessage("Check-in date is required")
    .isISO8601()
    .withMessage("Invalid check-in date"),

  body("checkOut")
    .notEmpty()
    .withMessage("Check-out date is required")
    .isISO8601()
    .withMessage("Invalid check-out date"),

  body("rooms")
    .notEmpty()
    .withMessage("Rooms count is required")
    .isInt({ min: 1 })
    .withMessage("Rooms must be at least 1"),
];

export {
  createBookingValidation,
  availabilityValidation,
};