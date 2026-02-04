import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Track initialization
let initialized = false;

// Initialize all routes on first request
async function initializeRoutes() {
  if (initialized) return;

  try {
    const { registerOAuthRoutes } = await import("../server/_core/oauth");
    const { appRouter } = await import("../server/routers");
    const { createContext } = await import("../server/_core/context");
    const { createExpressMiddleware } = await import("@trpc/server/adapters/express");

    // Register OAuth routes
    registerOAuthRoutes(app);

    // Register tRPC
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: appRouter,
        createContext,
      })
    );

    initialized = true;
    console.log("[API] Routes initialized successfully");
  } catch (error) {
    console.error("[API] Failed to initialize routes:", error);
    throw error;
  }
}

// Health check (always available)
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", initialized, timestamp: new Date().toISOString() });
});

// Middleware to ensure routes are initialized
app.use("/api", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await initializeRoutes();
    next();
  } catch (error) {
    console.error("[API] Initialization error:", error);
    res.status(500).json({ error: "Server initialization failed" });
  }
});

export default app;
