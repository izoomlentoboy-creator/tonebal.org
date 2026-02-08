import { integer, pgEnum, pgTable, serial, text, timestamp, varchar, unique, boolean } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "canceled"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

/**
 * Email verification and password reset tokens
 */
export const emailTokens = pgTable("email_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(), // "verify" | "reset"
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EmailToken = typeof emailTokens.$inferSelect;
export type InsertEmailToken = typeof emailTokens.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscriptions table - stores user subscriptions and access codes
 * Codes rotate every 30 days within the subscription period
 */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  paymentId: varchar("payment_id", { length: 100 }),
  accessCode: varchar("access_code", { length: 8 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Payments table - stores YooKassa payment records
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  yookassaPaymentId: varchar("yookassa_payment_id", { length: 100 }).notNull().unique(),
  amount: integer("amount").notNull(), // in kopecks (rubles * 100)
  status: paymentStatusEnum("status").default("pending").notNull(),
  nosology: varchar("nosology", { length: 50 }).default("all"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * User progress table - tracks lesson completion
 */
export const userProgress = pgTable(
  "user_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    nosologyId: varchar("nosology_id", { length: 50 }).notNull(),
    lessonId: varchar("lesson_id", { length: 50 }).notNull(),
    completed: integer("completed").default(0).notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("unique_progress").on(table.userId, table.nosologyId, table.lessonId)
  ]
);

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

/**
 * Voice ratings table - stores daily voice feeling ratings (1-10)
 */
export const voiceRatings = pgTable("voice_ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-10
  note: text("note"),
  ratedAt: timestamp("rated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VoiceRating = typeof voiceRatings.$inferSelect;
export type InsertVoiceRating = typeof voiceRatings.$inferInsert;

/**
 * User directions table - stores user's selected rehabilitation directions (multiple allowed)
 * Unique constraint on (userId, nosologyId) to prevent duplicates
 */
export const userDirections = pgTable(
  "user_directions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    nosologyId: varchar("nosology_id", { length: 50 }).notNull(),
    selectedAt: timestamp("selected_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("unique_user_direction").on(table.userId, table.nosologyId)
  ]
);

export type UserDirection = typeof userDirections.$inferSelect;
export type InsertUserDirection = typeof userDirections.$inferInsert;
