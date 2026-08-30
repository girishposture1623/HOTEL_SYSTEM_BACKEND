import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  findUserByEmail,
  createUser,
  saveOTP,
  findUserByEmailAndOTP,
  verifyUserOTP,
  findUserById,
  linkGoogleAccount,
  createGoogleUser,
} from "../models/user.model.js";

import {
  sendOTPEmail,
  sendWelcomeEmail,
} from "../config/mail.js";

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Check existing user
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await createUser({
      name,
      email,
      password: hashedPassword,
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expiry - 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    console.log(otp);

    // Save OTP
    await saveOTP(user.id, otp, expiresAt);

    // Send OTP email
    await sendOTPEmail(email, otp);

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify your email.",
      requiresVerification: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("Register controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find user with OTP
    const user = await findUserByEmailAndOTP(email, otp);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check OTP expiry
    if (!user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Verify user
    await verifyUserOTP(user.id);

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.log("Verify OTP controller error:", error);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    );

    // HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Login controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.log("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      },
    });
  } catch (error) {
    console.log("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get current user",
    });
  }
};

const googleCallback = async (req, res) => {
  try {
    const googleUser = req.user;

    if (!googleUser?.email) {
      return res.status(400).json({
        success: false,
        message: "Google email not found",
      });
    }

    const { name, email, googleId, profileImage } = googleUser;

    // Check existing user
    let user = await findUserByEmail(email);

    // New Google user
    if (!user) {
      const userId = await createGoogleUser({
        name,
        email,
        googleId,
        profileImage,
      });

      user = await findUserByEmail(email);
      await sendWelcomeEmail(user.email, user.name);
    }

    // Existing email user
    else if (!user.google_id) {
      await linkGoogleAccount(user.id, googleId, profileImage);

      user = await findUserByEmail(email);
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect frontend
    return res.redirect("http://localhost:5173/");
  } catch (error) {
    console.log("Google callback error:", error);

    return res.redirect(
      "http://localhost:5173/login?error=google_login_failed",
    );
  }
};

export { register, verifyOTP, login, getCurrentUser, logout, googleCallback };
