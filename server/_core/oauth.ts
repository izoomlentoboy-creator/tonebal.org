import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

/**
 * Авторизация для ToneBalance
 * Поддерживает: VK OAuth
 */

export function registerOAuthRoutes(app: Express) {
  // Проверка текущей сессии
  app.get("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user });
    } catch {
      res.json({ user: null });
    }
  });

  // VK ID SDK token endpoint (новый способ авторизации через VK ID SDK)
  app.post("/api/auth/vk/token", async (req: Request, res: Response) => {
    try {
      const { access_token, user_id, email } = req.body;

      if (!access_token || !user_id) {
        res.status(400).json({ error: "Missing access_token or user_id" });
        return;
      }

      // Получаем информацию о пользователе через VK API
      const userUrl = new URL("https://api.vk.com/method/users.get");
      userUrl.searchParams.set("user_ids", user_id.toString());
      userUrl.searchParams.set("fields", "photo_200,first_name,last_name");
      userUrl.searchParams.set("access_token", access_token);
      userUrl.searchParams.set("v", "5.131");

      const userResponse = await fetch(userUrl.toString());
      const userData = await userResponse.json();

      let userName = "";
      if (userData.response && userData.response[0]) {
        const vkUser = userData.response[0];
        userName = `${vkUser.first_name || ""} ${vkUser.last_name || ""}`.trim();
      }

      const vkUserId = `vk_${user_id}`;

      // Создаем или обновляем пользователя
      await db.upsertUser({
        openId: vkUserId,
        name: userName || null,
        email: email || null,
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

      res.json({ success: true });
    } catch (error) {
      console.error("[VK Auth] Token endpoint failed", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // VK OAuth callback (для стандартного OAuth и fallback кнопки)
  app.get("/api/auth/vk/callback", async (req: Request, res: Response) => {
    try {
      const { code, device_id } = req.query;

      if (!code || typeof code !== "string") {
        res.redirect("/login?error=no_code");
        return;
      }

      // Обмениваем code на access token через стандартный VK OAuth
      const tokenUrl = new URL("https://oauth.vk.com/access_token");
      tokenUrl.searchParams.set("client_id", "54441764");
      tokenUrl.searchParams.set("client_secret", process.env.VK_APP_SECRET || "");
      tokenUrl.searchParams.set("redirect_uri", `${ENV.baseUrl}/api/auth/vk/callback`);
      tokenUrl.searchParams.set("code", code);
      if (device_id && typeof device_id === "string") {
        tokenUrl.searchParams.set("device_id", device_id);
      }

      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();

      if (tokenData.error || !tokenData.access_token) {
        console.error("[VK Auth] Token exchange failed:", tokenData);
        res.redirect("/login?error=token_failed");
        return;
      }

      const userId = tokenData.user_id;
      const accessToken = tokenData.access_token;
      const userEmail = tokenData.email || null;

      // Получаем информацию о пользователе
      const userUrl = new URL("https://api.vk.com/method/users.get");
      userUrl.searchParams.set("user_ids", userId.toString());
      userUrl.searchParams.set("fields", "photo_200,first_name,last_name");
      userUrl.searchParams.set("access_token", accessToken);
      userUrl.searchParams.set("v", "5.131");

      const userResponse = await fetch(userUrl.toString());
      const userData = await userResponse.json();

      let userName = "";
      if (userData.response && userData.response[0]) {
        const vkUser = userData.response[0];
        userName = `${vkUser.first_name || ""} ${vkUser.last_name || ""}`.trim();
      }

      const vkUserId = `vk_${userId}`;

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
      res.redirect("/login?error=auth_failed");
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
