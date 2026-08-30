import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});


// ==============================
// OTP Email
// ==============================

const sendOTPEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"Stayora" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "Your Stayora Verification OTP",

      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verify Your Stayora Account</h2>

          <p>
            Thank you for registering with Stayora.
            Use the OTP below to verify your email address.
          </p>

          <div
            style="
              font-size: 30px;
              font-weight: bold;
              letter-spacing: 8px;
              margin: 25px 0;
            "
          >
            ${otp}
          </div>

          <p>
            This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not create this account, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log("OTP email sent successfully");

  } catch (error) {
    console.log("Send OTP email error:", error);
    throw error;
  }
};


// ==============================
// Welcome Email
// ==============================

const sendWelcomeEmail = async (email, name) => {
  try {
    await transporter.sendMail({
      from: `"Stayora" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "Welcome to Stayora 🎉",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            padding: 30px;
            background: #f5f7fa;
          "
        >

          <div
            style="
              max-width: 600px;
              margin: auto;
              background: white;
              padding: 30px;
              border-radius: 10px;
            "
          >

            <h2>Welcome to Stayora, ${name}! 🎉</h2>

            <p>
              Thank you for creating your Stayora account.
            </p>

            <p>
              Your email has been successfully verified
              and your account is now active.
            </p>

            <p>
              You can now search hotels, check availability
              and book your stay with Stayora.
            </p>

            <br>

            <p>
              Thank you for choosing Stayora.
            </p>

            <p>
              <strong>Happy Booking! 🏨</strong>
            </p>

            <p>
              Regards,<br>
              Stayora Team
            </p>

          </div>

        </div>
      `,
    });

    console.log("Welcome email sent successfully");

  } catch (error) {
    console.log("Send welcome email error:", error);
    throw error;
  }
};


export {
  sendOTPEmail,
  sendWelcomeEmail,
};