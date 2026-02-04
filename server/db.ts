import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
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
    .orderBy(subscriptions.expiresAt)
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

  // Try to insert, on duplicate key update
  await db
    .insert(userProgress)
    .values({
      userId,
      nosologyId,
      lessonId,
      completed: 1,
      completedAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        completed: 1,
        completedAt: new Date(),
      },
    });
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

// User Directions
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

  await db
    .insert(userDirections)
    .values({
      userId,
      nosologyId,
    })
    .onDuplicateKeyUpdate({
      set: {
        nosologyId,
        updatedAt: new Date(),
      },
    });
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
