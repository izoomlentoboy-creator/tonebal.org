import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth.js";
import { registerEmailAuthRoutes } from "./email-auth.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { serveStatic, setupVite } from "./vite.js";
import * as db from "../db.js";
import { validateAccessCode, normalizeAccessCode, getDaysRemaining } from "../utils/accessCode.js";
import { processSubscriptionReminders } from "../utils/subscription-reminders.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  registerEmailAuthRoutes(app);

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
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Cron endpoint for subscription reminders (can also be called externally)
  app.post("/api/cron/subscription-reminders", async (req, res) => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const result = await processSubscriptionReminders();
      res.json(result);
    } catch (error) {
      console.error("[Cron] Subscription reminders error:", error);
      res.status(500).json({ error: "Failed to process reminders" });
    }
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Run subscription reminders daily (for VPS deployment with PM2)
  if (process.env.NODE_ENV === "production") {
    const DAILY_MS = 24 * 60 * 60 * 1000;
    // Run first check 1 minute after startup, then every 24 hours
    setTimeout(() => {
      processSubscriptionReminders().catch(console.error);
      setInterval(() => {
        processSubscriptionReminders().catch(console.error);
      }, DAILY_MS);
    }, 60_000);
  }
}

startServer().catch(console.error);
