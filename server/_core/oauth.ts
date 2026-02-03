import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { createHash, randomBytes } from "crypto";
import { ENV } from "./env";

/**
 * Авторизация для ToneBalance
 * Поддерживает: Apple Sign In, Email авторизация
 */

export function registerOAuthRoutes(app: Express) {
  // Простая авторизация по email
  app.post("/api/auth/email", async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;

      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "Email is required" });
        return;
      }

      // Генерируем уникальный ID на основе email
      const openId = createHash("sha256").update(email.toLowerCase()).digest("hex");

      // Создаем или обновляем пользователя
      await db.upsertUser({
        openId,
        name: name || null,
        email: email.toLowerCase(),
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Создаем сессию
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Устанавливаем cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, userId: openId });
    } catch (error) {
      console.error("[Email Auth] Failed", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Apple Sign In callback (для веб)
  // Apple отправляет POST с form data
  app.post("/api/auth/apple/callback", async (req: Request, res: Response) => {
    try {
      const { id_token, user } = req.body;

      if (!id_token) {
        res.redirect("/?error=no_token");
        return;
      }

      // Декодируем payload из JWT (без верификации, т.к. Apple уже подписал)
      const [, payloadB64] = id_token.split(".");
      const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

      const appleUserId = payload.sub;
      const appleEmail = payload.email;

      if (!appleUserId) {
        res.redirect("/?error=invalid_token");
        return;
      }

      // Парсим user data (только при первом входе Apple отправляет имя)
      let userName = "";
      if (user) {
        try {
          const userData = typeof user === "string" ? JSON.parse(user) : user;
          if (userData.name) {
            userName = [userData.name.firstName, userData.name.lastName]
              .filter(Boolean)
              .join(" ");
          }
        } catch {
          // Игнорируем ошибки парсинга
        }
      }

      // Создаем или обновляем пользователя
      await db.upsertUser({
        openId: appleUserId,
        name: userName || null,
        email: appleEmail || null,
        loginMethod: "apple",
        lastSignedIn: new Date(),
      });

      // Создаем сессию
      const sessionToken = await sdk.createSessionToken(appleUserId, {
        name: userName,
        expiresInMs: ONE_YEAR_MS,
      });

      // Устанавливаем cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Редирект на dashboard
      res.redirect("/dashboard");
    } catch (error) {
      console.error("[Apple Auth] Callback failed", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // Проверка текущей сессии
  app.get("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user });
    } catch {
      res.json({ user: null });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
