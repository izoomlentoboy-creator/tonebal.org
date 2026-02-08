import * as db from "../db.js";
import { sendSubscriptionExpiryReminder } from "./email.js";

/**
 * Check for expiring subscriptions and send reminder emails.
 * Should be called once per day (via cron, setInterval, or API endpoint).
 *
 * Sends reminders:
 * - 7 days before expiry
 * - 1 day before expiry
 *
 * Only sends to users who have emailConsent enabled.
 * Tracks sent reminders to avoid duplicates.
 */
export async function processSubscriptionReminders(): Promise<{
  sent7d: number;
  sent1d: number;
  errors: number;
}> {
  let sent7d = 0;
  let sent1d = 0;
  let errors = 0;

  // Process 7-day reminders
  try {
    const expiring7d = await db.getExpiringSubscriptions(7);
    for (const { subscription, user } of expiring7d) {
      if (!user.email) continue;
      try {
        const daysRemaining = Math.ceil(
          (new Date(subscription.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );
        await sendSubscriptionExpiryReminder(
          user.email,
          user.name,
          Math.max(daysRemaining, 1),
          subscription.accessCode
        );
        await db.markReminderSent(subscription.id, "7d");
        sent7d++;
        console.log(`[Reminders] Sent 7-day reminder to ${user.email}`);
      } catch (err) {
        errors++;
        console.error(`[Reminders] Failed to send 7-day reminder to ${user.email}:`, err);
      }
    }
  } catch (err) {
    console.error("[Reminders] Error processing 7-day reminders:", err);
  }

  // Process 1-day reminders
  try {
    const expiring1d = await db.getExpiringSubscriptions(1);
    for (const { subscription, user } of expiring1d) {
      if (!user.email) continue;
      try {
        await sendSubscriptionExpiryReminder(
          user.email,
          user.name,
          1,
          subscription.accessCode
        );
        await db.markReminderSent(subscription.id, "1d");
        sent1d++;
        console.log(`[Reminders] Sent 1-day reminder to ${user.email}`);
      } catch (err) {
        errors++;
        console.error(`[Reminders] Failed to send 1-day reminder to ${user.email}:`, err);
      }
    }
  } catch (err) {
    console.error("[Reminders] Error processing 1-day reminders:", err);
  }

  console.log(`[Reminders] Done: ${sent7d} x 7-day, ${sent1d} x 1-day, ${errors} errors`);
  return { sent7d, sent1d, errors };
}
