import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { createHash, randomBytes } from "crypto";
import { ENV } from "./env";

/**
 * Авторизация для ToneBalance
 * Поддерживает: Apple Sign In, Google OAuth, VK OAuth, Email авторизация
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

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        res.redirect("/?error=no_code");
        return;
      }

      // Обмениваем code на access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: `${ENV.baseUrl}/api/auth/google/callback`,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        console.error("[Google Auth] Token exchange failed:", tokenData);
        res.redirect("/?error=token_failed");
        return;
      }

      // Получаем информацию о пользователе
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const userData = await userResponse.json();

      if (!userData.id) {
        res.redirect("/?error=user_data_failed");
        return;
      }

      const googleUserId = `google_${userData.id}`;
      const userName = userData.name || "";
      const userEmail = userData.email || null;

      // Создаем или обновляем пользователя
      await db.upsertUser({
        openId: googleUserId,
        name: userName || null,
        email: userEmail,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Создаем сессию
      const sessionToken = await sdk.createSessionToken(googleUserId, {
        name: userName,
        expiresInMs: ONE_YEAR_MS,
      });

      // Устанавливаем cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Редирект на dashboard
      res.redirect("/dashboard");
    } catch (error) {
      console.error("[Google Auth] Callback failed", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // VK OAuth callback (legacy - для обычного OAuth flow)
  app.get("/api/auth/vk/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        res.redirect("/?error=no_code");
        return;
      }

      // Обмениваем code на access token
      const tokenUrl = new URL("https://oauth.vk.com/access_token");
      tokenUrl.searchParams.set("client_id", ENV.vkAppId);
      tokenUrl.searchParams.set("client_secret", ENV.vkAppSecret);
      tokenUrl.searchParams.set("redirect_uri", `${ENV.baseUrl}/api/auth/vk/callback`);
      tokenUrl.searchParams.set("code", code);

      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token || !tokenData.user_id) {
        console.error("[VK Auth] Token exchange failed:", tokenData);
        res.redirect("/?error=token_failed");
        return;
      }

      // Получаем информацию о пользователе
      const userUrl = new URL("https://api.vk.com/method/users.get");
      userUrl.searchParams.set("user_ids", tokenData.user_id.toString());
      userUrl.searchParams.set("fields", "photo_200");
      userUrl.searchParams.set("access_token", tokenData.access_token);
      userUrl.searchParams.set("v", "5.131");

      const userResponse = await fetch(userUrl.toString());
      const userData = await userResponse.json();

      if (!userData.response || !userData.response[0]) {
        res.redirect("/?error=user_data_failed");
        return;
      }

      const vkUser = userData.response[0];
      const vkUserId = `vk_${vkUser.id}`;
      const userName = `${vkUser.first_name} ${vkUser.last_name}`.trim();
      const userEmail = tokenData.email || null;

      // Создаем или обновляем пользователя
      await db.upsertUser({
        openId: vkUserId,
        name: userName || null,
        email: userEmail,
        loginMethod: "vk",
        lastSignedIn: new Date(),
      });

      // Создаем сессию
      const sessionToken = await sdk.createSessionToken(vkUserId, {
        name: userName,
        expiresInMs: ONE_YEAR_MS,
      });

      // Устанавливаем cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Редирект на dashboard
      res.redirect("/dashboard");
    } catch (error) {
      console.error("[VK Auth] Callback failed", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // VK ID SDK - обработка токена от клиентского SDK
  app.get("/api/auth/vk/token", async (req: Request, res: Response) => {
    try {
      const { access_token, user_id, email } = req.query;

      if (!access_token || !user_id) {
        res.redirect("/?error=no_token");
        return;
      }

      // Получаем информацию о пользователе через VK API
      const userUrl = new URL("https://api.vk.com/method/users.get");
      userUrl.searchParams.set("user_ids", user_id.toString());
      userUrl.searchParams.set("fields", "photo_200");
      userUrl.searchParams.set("access_token", access_token.toString());
      userUrl.searchParams.set("v", "5.131");

      const userResponse = await fetch(userUrl.toString());
      const userData = await userResponse.json();

      if (!userData.response || !userData.response[0]) {
        console.error("[VK ID] User data failed:", userData);
        res.redirect("/?error=user_data_failed");
        return;
      }

      const vkUser = userData.response[0];
      const vkUserId = `vk_${vkUser.id}`;
      const userName = `${vkUser.first_name} ${vkUser.last_name}`.trim();
      const userEmail = (email as string) || null;

      // Создаем или обновляем пользователя
      await db.upsertUser({
        openId: vkUserId,
        name: userName || null,
        email: userEmail,
        loginMethod: "vk",
        lastSignedIn: new Date(),
      });

      // Создаем сессию
      const sessionToken = await sdk.createSessionToken(vkUserId, {
        name: userName,
        expiresInMs: ONE_YEAR_MS,
      });

      // Устанавливаем cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Редирект на dashboard
      res.redirect("/dashboard");
    } catch (error) {
      console.error("[VK ID] Token auth failed", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
