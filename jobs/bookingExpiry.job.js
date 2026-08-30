import cron from "node-cron";
import { expirePendingBookings } from "../models/booking.model.js";

const startBookingExpiryJob = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const expiredCount = await expirePendingBookings();

      if (expiredCount > 0) {
        console.log(
          `${expiredCount} pending booking(s) expired`
        );
      }
    } catch (error) {
      console.log(
        "Booking expiry cron error:",
        error
      );
    }
  });
};

export default startBookingExpiryJob;