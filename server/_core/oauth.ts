import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import * as crypto from "crypto";
import { parse as parseCookieHeader } from "cookie";

const VK_APP_ID = "54441764";
const VK_STATE_COOKIE = "vk_state";

/**
 * Авторизация для ToneBalance
 * Поддерживает: VK ID с silent_token flow
 */

// Генерация UUID для VK ID
function generateUUID(): string {
  return crypto.randomUUID();
}

// Генерация state для защиты от CSRF
function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

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

  // VK ID авторизация - начало (редирект на VK с silent_token)
  app.get("/api/auth/vk/start", (req: Request, res: Response) => {
    try {
      const uuid = generateUUID();
      const state = generateState();

      // Сохраняем state в cookie (5 минут)
      res.cookie(VK_STATE_COOKIE, JSON.stringify({ state, uuid }), {
        httpOnly: true,
        secure: ENV.isProduction,
        sameSite: "lax",
        maxAge: 5 * 60 * 1000, // 5 минут
        path: "/",
      });

      // Формируем URL для VK ID с silent_token
      const params = new URLSearchParams({
        uuid: uuid,
        app_id: VK_APP_ID,
        redirect_uri: `${ENV.baseUrl}/api/auth/vk/callback`,
        redirect_state: state,
        response_type: "silent_token",
      });

      const authUrl = `https://id.vk.com/auth?${params.toString()}`;
      res.redirect(authUrl);
    } catch (error) {
      console.error("[VK Auth] Start failed:", error);
      res.redirect("/login?error=start_failed");
    }
  });

  // VK ID callback (обработка ответа от VK)
  app.get("/api/auth/vk/callback", async (req: Request, res: Response) => {
    try {
      // VK ID возвращает payload как query параметр
      const { payload, state } = req.query;

      console.log("[VK Auth] Callback received:", { payload: !!payload, state });

      // Получаем сохранённый state из cookie
      const cookies = req.headers.cookie ? parseCookieHeader(req.headers.cookie) : {};
      const stateDataStr = cookies[VK_STATE_COOKIE];
      let savedState: string | null = null;
      let savedUuid: string | null = null;

      if (stateDataStr) {
        try {
          const stateData = JSON.parse(stateDataStr);
          savedState = stateData.state;
          savedUuid = stateData.uuid;
        } catch {
          console.warn("[VK Auth] Failed to parse state cookie");
        }
      }

      // Очищаем state cookie
      res.clearCookie(VK_STATE_COOKIE, { path: "/" });

      // Проверяем state
      if (savedState && state && state !== savedState) {
        console.error("[VK Auth] State mismatch");
        res.redirect("/login?error=state_mismatch");
        return;
      }

      if (!payload || typeof payload !== "string") {
        console.error("[VK Auth] No payload provided");
        res.redirect("/login?error=no_payload");
        return;
      }

      // Парсим payload (это JSON строка)
      let payloadData: any;
      try {
        payloadData = JSON.parse(payload);
      } catch {
        console.error("[VK Auth] Failed to parse payload");
        res.redirect("/login?error=invalid_payload");
        return;
      }

      console.log("[VK Auth] Parsed payload:", JSON.stringify(payloadData));

      const { token, uuid } = payloadData;

      if (!token) {
        console.error("[VK Auth] No token in payload:", payloadData);
        res.redirect("/login?error=no_token");
        return;
      }

      // Получаем сервисный ключ
      const serviceToken = process.env.VK_SERVICE_TOKEN;
      if (!serviceToken) {
        console.error("[VK Auth] VK_SERVICE_TOKEN not configured");
        res.redirect("/login?error=config_error");
        return;
      }

      // Обмениваем silent_token на access_token через VK API
      const exchangeParams = new URLSearchParams({
        v: "5.131",
        access_token: serviceToken,
        token: token,
        uuid: uuid || savedUuid || "",
      });

      let exchangeData: any;
      try {
        const exchangeResponse = await fetch(
          `https://api.vk.com/method/auth.exchangeSilentAuthToken?${exchangeParams.toString()}`
        );
        exchangeData = await exchangeResponse.json();
        console.log("[VK Auth] Exchange response:", JSON.stringify(exchangeData));
      } catch (fetchError) {
        console.error("[VK Auth] Exchange fetch failed:", fetchError);
        res.redirect("/login?error=exchange_failed");
        return;
      }

      if (exchangeData.error || !exchangeData.response?.access_token) {
        console.error("[VK Auth] Exchange failed:", exchangeData);
        res.redirect("/login?error=exchange_error");
        return;
      }

      const accessToken = exchangeData.response.access_token;
      const userId = exchangeData.response.user_id;
      const userEmail = exchangeData.response.email || null;

      // Получаем информацию о пользователе
      let userName = "";
      try {
        const userUrl = new URL("https://api.vk.com/method/users.get");
        userUrl.searchParams.set("user_ids", userId.toString());
        userUrl.searchParams.set("fields", "photo_200,first_name,last_name");
        userUrl.searchParams.set("access_token", accessToken);
        userUrl.searchParams.set("v", "5.131");

        const userResponse = await fetch(userUrl.toString());
        const userData = await userResponse.json();

        if (userData.response && userData.response[0]) {
          const vkUser = userData.response[0];
          userName = `${vkUser.first_name || ""} ${vkUser.last_name || ""}`.trim();
        }
      } catch (userFetchError) {
        console.warn("[VK Auth] Failed to fetch user info:", userFetchError);
      }

      const vkUserId = `vk_${userId}`;

      // Создаем или обновляем пользователя
      try {
        await db.upsertUser({
          openId: vkUserId,
          name: userName || null,
          email: userEmail,
          loginMethod: "vk",
          lastSignedIn: new Date(),
        });
      } catch (dbError) {
        console.error("[VK Auth] Database error:", dbError);
        res.redirect("/login?error=db_error");
        return;
      }

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
      console.error("[VK Auth] Callback failed:", error);
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
