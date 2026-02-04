import "dotenv/config";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import * as db from "../server/db";
import { validateAccessCode, normalizeAccessCode, getDaysRemaining } from "../server/utils/accessCode";

const app = express();

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// REST API endpoint for iOS code activation
app.post("/api/activate-code", async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing code or userId",
      });
    }

    // Validate code format
    const validation = validateAccessCode(code);
    if (!validation.valid) {
      return res.json({
        success: false,
        error: validation.error || "Invalid code",
      });
    }

    // Normalize code (remove dashes, uppercase)
    const normalizedCode = normalizeAccessCode(code);

    // Check if subscription exists with this code
    const subscription = await db.getSubscriptionByCode(normalizedCode);

    if (subscription) {
      const isActive = subscription.isActive === 1 &&
        new Date(subscription.expiresAt) > new Date();

      if (isActive) {
        // Code is valid and active
        return res.json({
          success: true,
          isActive: true,
          expiresAt: subscription.expiresAt.toISOString(),
          daysRemaining: getDaysRemaining(subscription.expiresAt),
        });
      } else {
        // Code has expired
        return res.json({
          success: false,
          error: "Code has expired",
        });
      }
    }

    // Code not found in database - might be a valid format but not issued yet
    return res.json({
      success: false,
      error: "Code not found",
    });
  } catch (error) {
    console.error("[API] activate-code error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Vercel serverless function handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
