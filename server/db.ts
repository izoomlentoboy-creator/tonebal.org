import { eq, and, gte, lte, sql } from "drizzle-orm";
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
  dailyActivity,
  InsertDailyActivity,
  dailyProgress,
  InsertDailyProgress
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

// Daily Activity
export async function getDailyActivity(userId: number, startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(dailyActivity)
    .where(
      and(
        eq(dailyActivity.userId, userId),
        gte(dailyActivity.date, startDate),
        lte(dailyActivity.date, endDate)
      )
    )
    .orderBy(dailyActivity.date);
}

export async function upsertDailyActivity(
  userId: number,
  date: string,
  minutesToAdd: number,
  nosologyId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get existing activity
  const existing = await db
    .select()
    .from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.date, date)))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    const currentNosologies = current.nosologiesWorked
      ? JSON.parse(current.nosologiesWorked)
      : [];

    if (!currentNosologies.includes(nosologyId)) {
      currentNosologies.push(nosologyId);
    }

    await db
      .update(dailyActivity)
      .set({
        lessonsCompleted: sql`${dailyActivity.lessonsCompleted} + 1`,
        totalMinutes: sql`${dailyActivity.totalMinutes} + ${minutesToAdd}`,
        nosologiesWorked: JSON.stringify(currentNosologies),
      })
      .where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.date, date)));
  } else {
    await db.insert(dailyActivity).values({
      userId,
      date,
      lessonsCompleted: 1,
      totalMinutes: minutesToAdd,
      nosologiesWorked: JSON.stringify([nosologyId]),
    });
  }
}

// Daily Progress
export async function getDailyProgress(userId: number, date: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(dailyProgress)
    .where(and(eq(dailyProgress.userId, userId), eq(dailyProgress.date, date)));
}

export async function upsertDailyProgress(
  userId: number,
  nosologyId: string,
  date: string,
  totalLessons: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(dailyProgress)
    .values({
      userId,
      nosologyId,
      date,
      lessonsCompleted: 1,
      totalLessons,
    })
    .onDuplicateKeyUpdate({
      set: {
        lessonsCompleted: sql`${dailyProgress.lessonsCompleted} + 1`,
      },
    });
}

// User Statistics
export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      totalDays: 0,
      totalLessons: 0,
      totalMinutes: 0,
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  // Get all activity
  const activity = await db
    .select()
    .from(dailyActivity)
    .where(eq(dailyActivity.userId, userId))
    .orderBy(dailyActivity.date);

  // Get completed lessons count
  const completedLessons = await db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, 1)));

  const totalDays = activity.length;
  const totalLessons = completedLessons.length;
  const totalMinutes = activity.reduce((sum, a) => sum + a.totalMinutes, 0);

  // Calculate streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const practiceSet = new Set(activity.map(a => a.date));

  // Current streak (from today backwards)
  for (let i = 0; i <= 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];
    if (practiceSet.has(dateStr)) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  // Best streak
  const sortedDates = Array.from(practiceSet).sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  return {
    totalDays,
    totalLessons,
    totalMinutes,
    currentStreak,
    bestStreak,
  };
}
