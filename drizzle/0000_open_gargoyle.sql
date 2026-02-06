CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"yookassa_payment_id" varchar(100) NOT NULL,
	"amount" integer NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"nosology" varchar(50) DEFAULT 'all',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_yookassa_payment_id_unique" UNIQUE("yookassa_payment_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"payment_id" varchar(100),
	"access_code" varchar(8) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"code_generated_at" timestamp DEFAULT now() NOT NULL,
	"code_revealed" integer DEFAULT 0 NOT NULL,
	"code_revealed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "user_directions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"nosology_id" varchar(50) NOT NULL,
	"selected_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_direction" UNIQUE("user_id","nosology_id")
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"nosology_id" varchar(50) NOT NULL,
	"lesson_id" varchar(50) NOT NULL,
	"completed" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_progress" UNIQUE("user_id","nosology_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
CREATE TABLE "voice_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"note" text,
	"rated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
