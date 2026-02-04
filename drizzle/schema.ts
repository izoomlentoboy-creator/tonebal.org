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
  // One-time code reveal system
  codeRevealed: int("codeRevealed").default(0).notNull(), // 0 = hidden, 1 = revealed and used
  codeRevealedAt: timestamp("codeRevealedAt"), // When code was revealed (for 5-min cancel window)
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
 * Voice ratings table - stores daily voice feeling ratings (1-10)
 */
export const voiceRatings = mysqlTable("voice_ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-10
  note: text("note"), // Optional note about feelings
  ratedAt: timestamp("ratedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoiceRating = typeof voiceRatings.$inferSelect;
export type InsertVoiceRating = typeof voiceRatings.$inferInsert;

/**
 * User directions table - stores user's selected rehabilitation direction
 */
export const userDirections = mysqlTable("user_directions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  nosologyId: varchar("nosologyId", { length: 50 }).notNull(),
  selectedAt: timestamp("selectedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserDirection = typeof userDirections.$inferSelect;
export type InsertUserDirection = typeof userDirections.$inferInsert;