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

  // VK OAuth callback (legacy, для обратной совместимости)
  app.get("/api/auth/vk/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        res.redirect("/login?error=no_code");
        return;
      }

      // Обмениваем code на access token через VK ID
      const tokenResponse = await fetch("https://id.vk.com/oauth2/auth", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: "54441764",
          client_secret: process.env.VK_APP_SECRET || "",
          redirect_uri: `${ENV.baseUrl}/api/auth/vk/callback`,
          code_verifier: "",
        }).toString(),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token || !tokenData.user_id) {
        console.error("[VK Auth] Token exchange failed:", tokenData);
        res.redirect("/login?error=token_failed");
        return;
      }

      // Получаем информацию о пользователе
      const userUrl = new URL("https://api.vk.com/method/users.get");
      userUrl.searchParams.set("user_ids", tokenData.user_id.toString());
      userUrl.searchParams.set("fields", "photo_200,first_name,last_name");
      userUrl.searchParams.set("access_token", tokenData.access_token);
      userUrl.searchParams.set("v", "5.131");

      const userResponse = await fetch(userUrl.toString());
      const userData = await userResponse.json();

      let userName = "";
      if (userData.response && userData.response[0]) {
        const vkUser = userData.response[0];
        userName = `${vkUser.first_name || ""} ${vkUser.last_name || ""}`.trim();
      }

      const vkUserId = `vk_${tokenData.user_id}`;
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
