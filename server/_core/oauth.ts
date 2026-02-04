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

  // VK OAuth callback
  app.get("/api/auth/vk/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== "string") {
        res.redirect("/?error=no_code");
        return;
      }

      // Обмениваем code на access token
      const tokenUrl = new URL("https://oauth.vk.com/access_token");
      tokenUrl.searchParams.set("client_id", process.env.VITE_VK_APP_ID || "");
      tokenUrl.searchParams.set("client_secret", process.env.VK_APP_SECRET || "");
      tokenUrl.searchParams.set("redirect_uri", `${ENV.baseUrl}/api/auth/vk/callback`);
      tokenUrl.searchParams.set("code", code);

      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token || !tokenData.user_id) {
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

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
