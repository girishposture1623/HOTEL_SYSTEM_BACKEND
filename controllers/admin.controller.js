import {
    deleteUserByAdmin,
    getAllUsers,
    getBookingOverview,
  getDashboardStats,
  getHotelAvailability,
  getRecentBookings,
  getRevenueOverview,
  getUserById,
  updateUserByAdmin,
} from "../models/admin.model.js";


const dashboardStats = async (req, res) => {
  try {

    const stats =
      await getDashboardStats();

    return res.status(200).json({
      success: true,
      stats,
    });

  } catch (error) {

    console.log(
      "Dashboard stats controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get dashboard statistics",
    });
  }
};

const recentBookings = async (req, res) => {
  try {
    const bookings =
      await getRecentBookings();

    return res.status(200).json({
      success: true,
      bookings,
    });

  } catch (error) {
    console.log(
      "Recent bookings controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get recent bookings",
    });
  }
};

const bookingOverview = async (req, res) => {
  try {
    const overview =
      await getBookingOverview();

    return res.status(200).json({
      success: true,
      overview,
    });

  } catch (error) {
    console.log(
      "Booking overview controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get booking overview",
    });
  }
};

const revenueOverview = async (req, res) => {
  try {
    const revenue =
      await getRevenueOverview();

    return res.status(200).json({
      success: true,
      revenue,
    });

  } catch (error) {
    console.log(
      "Revenue overview controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get revenue overview",
    });
  }
};

const hotelAvailability = async (req, res) => {
  try {
    const hotels =
      await getHotelAvailability();

    return res.status(200).json({
      success: true,
      hotels,
    });

  } catch (error) {
    console.log(
      "Hotel availability controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get hotel availability",
    });
  }
};

const allUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.log("All users controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

const singleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(
      "Single user controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      role,
      is_verified,
    } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: "Name and role are required",
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updated =
      await updateUserByAdmin(id, {
        name,
        role,
        is_verified:
          is_verified ? 1 : 0,
      });

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "User update failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.log(
      "Update user controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        message:
          "Admin cannot delete own account",
      });
    }

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const deleted =
      await deleteUserByAdmin(id);

    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: "User deletion failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(
      "Delete user controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};
export {
  dashboardStats,
  recentBookings,
  bookingOverview,
  revenueOverview,
  hotelAvailability,
  allUsers,
  singleUser,
  updateUser,
  deleteUser
};