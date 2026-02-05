import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth.js";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";
import * as db from "../server/db.js";
import { validateAccessCode, normalizeAccessCode, getDaysRemaining } from "../server/utils/accessCode.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth routes
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

    const validation = validateAccessCode(code);
    if (!validation.valid) {
      return res.json({
        success: false,
        error: validation.error || "Invalid code",
      });
    }

    const normalizedCode = normalizeAccessCode(code);
    const subscription = await db.getSubscriptionByCode(normalizedCode);

    if (subscription) {
      const isActive = subscription.isActive === 1 &&
        new Date(subscription.expiresAt) > new Date();

      if (isActive) {
        return res.json({
          success: true,
          isActive: true,
          expiresAt: subscription.expiresAt.toISOString(),
          daysRemaining: getDaysRemaining(subscription.expiresAt),
        });
      } else {
        return res.json({
          success: false,
          error: "Code has expired",
        });
      }
    }

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

export default app;
