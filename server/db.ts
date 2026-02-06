import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  InsertUser,
  users,
  subscriptions,
  InsertSubscription,
  payments,
  InsertPayment,
  userProgress,
  InsertUserProgress,
  voiceRatings,
  InsertVoiceRating,
  userDirections,
  InsertUserDirection
} from "../drizzle/schema.js";
import { ENV } from './_core/env.js';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      _db = drizzle(sql);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

    if (existing.length > 0) {
      // Update existing user
      const updateSet: Record<string, unknown> = {};

      if (user.name !== undefined) updateSet.name = user.name;
      if (user.email !== undefined) updateSet.email = user.email;
      if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
      if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
      if (user.role !== undefined) updateSet.role = user.role;

      updateSet.updatedAt = new Date();

      await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      const values: InsertUser = {
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        lastSignedIn: user.lastSignedIn ?? new Date(),
        role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
      };

      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Subscriptions
export async function getActiveSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(subscriptions)
    .where(
      eq(subscriptions.userId, userId)
    )
    .orderBy(desc(subscriptions.expiresAt))
    .limit(1);

  if (result.length === 0) return undefined;

  const sub = result[0];
  // Check if still active
  if (sub && sub.isActive === 1 && new Date(sub.expiresAt) > new Date()) {
    return sub;
  }

  return undefined;
}

export async function createSubscription(data: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(subscriptions).values(data);
}

export async function getSubscriptionByCode(accessCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.accessCode, accessCode))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Update subscription code (for rotation)
export async function rotateSubscriptionCode(subscriptionId: number, newCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(subscriptions)
    .set({
      accessCode: newCode,
      codeGeneratedAt: new Date(),
      codeRevealed: 0,
      codeRevealedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// Payments
export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payments).values(data);
  return result;
}

export async function getPaymentByYookassaId(yookassaPaymentId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.yookassaPaymentId, yookassaPaymentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updatePaymentStatus(
  yookassaPaymentId: string,
  status: "pending" | "succeeded" | "canceled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(payments)
    .set({ status, updatedAt: new Date() })
    .where(eq(payments.yookassaPaymentId, yookassaPaymentId));
}

// User Progress
export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId));
}

export async function markLessonComplete(
  userId: number,
  nosologyId: string,
  lessonId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if exists
  const existing = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.nosologyId, nosologyId),
        eq(userProgress.lessonId, lessonId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userProgress)
      .set({ completed: 1, completedAt: new Date() })
      .where(eq(userProgress.id, existing[0].id));
  } else {
    await db.insert(userProgress).values({
      userId,
      nosologyId,
      lessonId,
      completed: 1,
      completedAt: new Date(),
    });
  }
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Voice Ratings
export async function addVoiceRating(data: InsertVoiceRating) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(voiceRatings).values(data);
}

export async function getUserVoiceRatings(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(voiceRatings)
    .where(eq(voiceRatings.userId, userId))
    .orderBy(desc(voiceRatings.ratedAt))
    .limit(limit);
}

export async function getVoiceRatingsByDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(voiceRatings)
    .where(
      and(
        eq(voiceRatings.userId, userId),
        gte(voiceRatings.ratedAt, startDate),
        lte(voiceRatings.ratedAt, endDate)
      )
    )
    .orderBy(voiceRatings.ratedAt);
}

// User Directions (multiple)
export async function getUserDirections(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(userDirections)
    .where(eq(userDirections.userId, userId))
    .orderBy(userDirections.selectedAt);
}

export async function setUserDirections(userId: number, nosologyIds: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all existing directions for user
  await db.delete(userDirections).where(eq(userDirections.userId, userId));

  // Insert new directions
  if (nosologyIds.length > 0) {
    const values = nosologyIds.map(nosologyId => ({
      userId,
      nosologyId,
    }));
    await db.insert(userDirections).values(values);
  }
}

// Legacy single direction support (returns first direction)
export async function getUserDirection(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(userDirections)
    .where(eq(userDirections.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function setUserDirection(userId: number, nosologyId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(userDirections)
    .where(
      and(
        eq(userDirections.userId, userId),
        eq(userDirections.nosologyId, nosologyId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userDirections).values({ userId, nosologyId });
  }
}

// Subscription Code Reveal
export async function revealAccessCode(subscriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(subscriptions)
    .set({
      codeRevealed: 1,
      codeRevealedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function cancelCodeReveal(subscriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Only allow cancel within 5 minutes of reveal
  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  if (sub.length === 0) {
    throw new Error("Subscription not found");
  }

  const subscription = sub[0];

  if (!subscription.codeRevealedAt) {
    throw new Error("Code was not revealed");
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (subscription.codeRevealedAt < fiveMinutesAgo) {
    throw new Error("Cancel window expired (5 minutes)");
  }

  await db
    .update(subscriptions)
    .set({
      codeRevealed: 0,
      codeRevealedAt: null,
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// Progress Calendar - Get unique days with completed lessons
export async function getProgressCalendar(userId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const progress = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, 1),
        gte(userProgress.completedAt, startDate),
        lte(userProgress.completedAt, endDate)
      )
    );

  // Get unique dates
  const uniqueDates = new Set<string>();
  progress.forEach(p => {
    if (p.completedAt) {
      uniqueDates.add(p.completedAt.toISOString().split('T')[0]);
    }
  });

  return Array.from(uniqueDates);
}

// Activity Stats - Lessons completed per day for last N days
export async function getActivityStats(userId: number, days = 7) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const progress = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, 1),
        gte(userProgress.completedAt, startDate)
      )
    );

  // Group by date
  const stats: Record<string, number> = {};
  progress.forEach(p => {
    if (p.completedAt) {
      const date = p.completedAt.toISOString().split('T')[0];
      stats[date] = (stats[date] || 0) + 1;
    }
  });

  // Fill in missing dates with 0
  const result: Array<{ date: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: stats[dateStr] || 0,
    });
  }

  return result;
}

// Get lessons completed today (timezone-aware)
export async function getTodayCompletedLessons(userId: number, timezone: string) {
  const db = await getDb();
  if (!db) return [];

  // Calculate today's start/end in user's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(now); // YYYY-MM-DD

  // Create start/end of day in user's timezone
  const startOfDay = new Date(`${todayStr}T00:00:00`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999`);

  // Adjust to UTC by reversing timezone offset
  const tzOffset = getTimezoneOffsetMinutes(timezone, now);
  const startUTC = new Date(startOfDay.getTime() + tzOffset * 60 * 1000);
  const endUTC = new Date(endOfDay.getTime() + tzOffset * 60 * 1000);

  return await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, 1),
        gte(userProgress.completedAt, startUTC),
        lte(userProgress.completedAt, endUTC)
      )
    );
}

// Helper to get timezone offset in minutes
function getTimezoneOffsetMinutes(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (utcDate.getTime() - tzDate.getTime()) / (60 * 1000);
}

// Update user timezone (currently a no-op: timezone column not yet in DB)
export async function updateUserTimezone(_userId: number, _timezone: string) {
  // TODO: add timezone column to users table via migration, then enable this
}

// Get user's activity streak (consecutive days)
export async function getActivityStreak(userId: number, timezone: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Get all completed dates
  const progress = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, 1)
      )
    )
    .orderBy(desc(userProgress.completedAt));

  if (progress.length === 0) return 0;

  // Get unique dates in user's timezone
  const uniqueDates = new Set<string>();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  progress.forEach(p => {
    if (p.completedAt) {
      uniqueDates.add(formatter.format(new Date(p.completedAt)));
    }
  });

  const sortedDates = Array.from(uniqueDates).sort().reverse();

  // Check streak starting from today
  const today = formatter.format(new Date());
  let streak = 0;
  let checkDate = new Date();

  // If today has activity, start counting from today, else from yesterday
  if (sortedDates[0] !== today) {
    // Check if yesterday had activity
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterday = formatter.format(checkDate);
    if (sortedDates[0] !== yesterday) {
      return 0;
    }
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = formatter.format(checkDate);
    if (uniqueDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
