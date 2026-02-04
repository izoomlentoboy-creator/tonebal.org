import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** User identifier from OAuth provider (Apple ID, email hash, etc.). Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscriptions table - stores user subscriptions and access codes
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  paymentId: varchar("paymentId", { length: 100 }),
  accessCode: varchar("accessCode", { length: 8 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Payments table - stores YooKassa payment records
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  yookassaPaymentId: varchar("yookassaPaymentId", { length: 100 }).notNull().unique(),
  amount: int("amount").notNull(), // in kopecks (rubles * 100)
  status: mysqlEnum("status", ["pending", "succeeded", "canceled"]).default("pending").notNull(),
  nosology: varchar("nosology", { length: 50 }).default("all"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * User progress table - tracks lesson completion
 */
export const userProgress = mysqlTable(
  "user_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    nosologyId: varchar("nosologyId", { length: 50 }).notNull(),
    lessonId: varchar("lessonId", { length: 50 }).notNull(),
    completed: int("completed").default(0).notNull(),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    uniqueProgress: {
      columns: [table.userId, table.nosologyId, table.lessonId],
      name: "unique_progress"
    }
  })
);

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

/**
 * Daily activity table - tracks user practice sessions per day
 */
export const dailyActivity = mysqlTable(
  "daily_activity",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
    lessonsCompleted: int("lessonsCompleted").default(0).notNull(),
    totalMinutes: int("totalMinutes").default(0).notNull(),
    nosologiesWorked: text("nosologiesWorked"), // JSON array of nosology IDs
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uniqueDaily: {
      columns: [table.userId, table.date],
      name: "unique_daily_activity"
    }
  })
);

export type DailyActivity = typeof dailyActivity.$inferSelect;
export type InsertDailyActivity = typeof dailyActivity.$inferInsert;

/**
 * Daily progress table - tracks daily progress per nosology (resets each day)
 */
export const dailyProgress = mysqlTable(
  "daily_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    nosologyId: varchar("nosologyId", { length: 50 }).notNull(),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
    lessonsCompleted: int("lessonsCompleted").default(0).notNull(),
    totalLessons: int("totalLessons").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    uniqueDailyProgress: {
      columns: [table.userId, table.nosologyId, table.date],
      name: "unique_daily_progress"
    }
  })
);

export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = typeof dailyProgress.$inferInsert;