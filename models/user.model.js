import db from "../config/db.js";

const findUser = async () => {
  try {
    const [rows] = await db.execute(`SELECT * FROM users`);
    return rows;
    // console.log(rows)
  } catch (error) {
    console.log("Find user error:", error);
    throw error;
  }
};

const findUserById = async (id) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        id,
        name,
        email,
        role,
        is_verified,
        created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    return rows[0] || null;
  } catch (error) {
    console.log("Find user by ID error:", error);
    throw error;
  }
};

const findUserByEmail = async (email) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        google_id,
        profile_image,
        password,
        role,
        is_verified
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    return rows[0] || null;
  } catch (error) {
    console.log(
      "Find user by email error:",
      error
    );
    throw error;
  }
};

const createUser = async ({ name, email, password }) => {
  try {
    const [result] = await db.execute(
      `INSERT INTO users
        (name, email, password)
       VALUES (?, ?, ?)`,
      [name, email, password],
    );

    return {
      id: result.insertId,
      name,
      email,
    };
  } catch (error) {
    console.log("Create user error:", error);
    throw error;
  }
};

const verifyUser = async (id) => {
  try {
    const [result] = await db.execute(
      `UPDATE users
       SET is_verified = TRUE
       WHERE id = ?`,
      [id],
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log("Verify user error:", error);
    throw error;
  }
};

const saveOTP = async (userId, otp, expiresAt) => {
  try {
    const [result] = await db.execute(
      `UPDATE users
       SET otp = ?, otp_expires_at = ?
       WHERE id = ?`,
      [otp, expiresAt, userId],
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log("Save OTP error:", error);
    throw error;
  }
};

const updateUserPassword = async (
  userId,
  password
) => {
  const [result] = await db.query(
    `
      UPDATE users
      SET password = ?
      WHERE id = ?
    `,
    [password, userId]
  );

  return result;
};

const findUserByEmailAndOTP = async (email, otp) => {
  try {
    const [rows] = await db.execute(
      `SELECT *
       FROM users
       WHERE email = ?
       AND otp = ?
       LIMIT 1`,
      [email, otp],
    );

    return rows[0] || null;
  } catch (error) {
    console.log("Find OTP user error:", error);
    throw error;
  }
};

const verifyUserOTP = async (userId) => {
  try {
    const [result] = await db.execute(
      `UPDATE users
       SET is_verified = TRUE,
           otp = NULL,
           otp_expires_at = NULL
       WHERE id = ?`,
      [userId],
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.log("Verify OTP error:", error);
    throw error;
  }
};

const updateUserOTP = async (
  userId,
  otp,
  otpExpiresAt
) => {
  const [result] = await db.query(
    `
    UPDATE users
    SET
      otp = ?,
      otp_expires_at = ?
    WHERE id = ?
    `,
    [
      otp,
      otpExpiresAt,
      userId,
    ]
  );

  return result;
};

const linkGoogleAccount = async (
  userId,
  googleId,
  profileImage
) => {
  try {
    await db.execute(
      `
      UPDATE users
      SET
        google_id = ?,
        profile_image = ?
      WHERE id = ?
      `,
      [
        googleId,
        profileImage,
        userId,
      ]
    );
  } catch (error) {
    console.log(
      "Link Google account error:",
      error
    );
    throw error;
  }
};

const createGoogleUser = async ({
  name,
  email,
  googleId,
  profileImage,
}) => {
  try {
    const [result] = await db.execute(
      `
      INSERT INTO users
      (
        name,
        email,
        google_id,
        profile_image,
        password,
        role,
        is_verified
      )
      VALUES (?, ?, ?, ?, NULL, 'user', 1)
      `,
      [
        name,
        email,
        googleId,
        profileImage,
      ]
    );

    return result.insertId;
  } catch (error) {
    console.log(
      "Create Google user error:",
      error
    );
    throw error;
  }
};

export {
  findUser,
  findUserByEmail,
  findUserById,
  createUser,
  verifyUser,
  saveOTP,
  findUserByEmailAndOTP,
  verifyUserOTP,
  linkGoogleAccount,
  createGoogleUser,
  updateUserOTP,
  updateUserPassword
};
