import express from "express";
import {
  getCurrentUser,
  googleCallback,
  login,
  logout,
  register,
  verifyOTP,
} from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";
import passport from "../config/google.js";
import { loginValidation, registerValidation, verifyOTPValidation } from "../middleware/auth.validation.js";
import validate from "../middleware/validation.middleware.js";

const authRoute = express.Router();

authRoute.post("/register", registerValidation, validate, register);
authRoute.post("/verify-otp", verifyOTPValidation, validate, verifyOTP);
authRoute.post("/login",loginValidation, validate, login);
authRoute.get("/me", protect, getCurrentUser);
authRoute.post("/logout", logout);

authRoute.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

authRoute.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  googleCallback,
);

export default authRoute;
