import db from "../config/db.js";

const isWebhookProcessed = async (eventId) => {
  try {
    const [rows] = await db.execute(
      `
      SELECT id
      FROM webhook_events
      WHERE event_id = ?
      LIMIT 1
      `,
      [eventId]
    );

    return rows.length > 0;
  } catch (error) {
    console.log("Check webhook event error:", error);
    throw error;
  }
};


const saveWebhookEvent = async (
  eventId,
  eventName
) => {
  try {
    const [result] = await db.execute(
      `
      INSERT INTO webhook_events
      (
        event_id,
        event_name
      )
      VALUES (?, ?)
      `,
      [
        eventId,
        eventName,
      ]
    );

    return result.insertId;
  } catch (error) {
    console.log("Save webhook event error:", error);
    throw error;
  }
};


export {
  isWebhookProcessed,
  saveWebhookEvent,
};