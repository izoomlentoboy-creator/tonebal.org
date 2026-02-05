import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import * as crypto from "crypto";
import { parse as parseCookieHeader } from "cookie";

const VK_APP_ID = "54441764";
const VK_AUTH_COOKIE = "vk_auth";

/**
 * Авторизация для ToneBalance
 * Поддерживает: VK ID с OAuth 2.1 + PKCE
 */

// Генерация state для защиты от CSRF
function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Генерация code_verifier для PKCE (RFC 7636)
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

// Генерация code_challenge для PKCE (S256)
function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  return hash.toString("base64url");
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

  // VK ID авторизация - начало (OAuth 2.1 + PKCE)
  app.get("/api/auth/vk/start", (req: Request, res: Response) => {
    try {
      const state = generateState();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      // Сохраняем state и code_verifier в cookie (10 минут)
      res.cookie(VK_AUTH_COOKIE, JSON.stringify({ state, codeVerifier }), {
        httpOnly: true,
        secure: ENV.isProduction,
        sameSite: "lax",
        maxAge: 10 * 60 * 1000, // 10 минут
        path: "/",
      });

      // Формируем URL для VK ID OAuth 2.1
      const params = new URLSearchParams({
        client_id: VK_APP_ID,
        redirect_uri: `${ENV.baseUrl}/api/auth/vk/callback`,
        response_type: "code",
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: "s256",
        scope: "", // Базовые права (имя, фото)
      });

      const authUrl = `https://id.vk.com/authorize?${params.toString()}`;
      res.redirect(authUrl);
    } catch (error) {
      console.error("[VK Auth] Start failed:", error);
      res.redirect("/login?error=start_failed");
    }
  });

  // VK ID callback (обработка OAuth 2.1 authorization code)
  app.get("/api/auth/vk/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error, error_description } = req.query;

      console.log("[VK Auth] Callback received:", { code: !!code, state, error });

      // Проверяем ошибки от VK
      if (error) {
        console.error("[VK Auth] VK returned error:", error, error_description);
        res.redirect(`/login?error=${error}`);
        return;
      }

      // Получаем сохранённый state и code_verifier из cookie
      const cookies = req.headers.cookie ? parseCookieHeader(req.headers.cookie) : {};
      const authDataStr = cookies[VK_AUTH_COOKIE];
      let savedState: string | null = null;
      let codeVerifier: string | null = null;

      if (authDataStr) {
        try {
          const authData = JSON.parse(authDataStr);
          savedState = authData.state;
          codeVerifier = authData.codeVerifier;
        } catch {
          console.warn("[VK Auth] Failed to parse auth cookie");
        }
      }

      // Очищаем auth cookie
      res.clearCookie(VK_AUTH_COOKIE, { path: "/" });

      // Проверяем state (CSRF protection)
      if (!savedState || !state || state !== savedState) {
        console.error("[VK Auth] State mismatch:", { savedState, state });
        res.redirect("/login?error=state_mismatch");
        return;
      }

      if (!code || typeof code !== "string") {
        console.error("[VK Auth] No authorization code provided");
        res.redirect("/login?error=no_code");
        return;
      }

      if (!codeVerifier) {
        console.error("[VK Auth] No code_verifier found");
        res.redirect("/login?error=no_verifier");
        return;
      }

      // Обмениваем authorization code на access_token через VK ID OAuth 2.1
      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        code_verifier: codeVerifier,
        client_id: VK_APP_ID,
        redirect_uri: `${ENV.baseUrl}/api/auth/vk/callback`,
        device_id: crypto.randomUUID(), // Уникальный ID устройства
      });

      let tokenData: any;
      try {
        const tokenResponse = await fetch("https://id.vk.com/oauth2/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: tokenParams.toString(),
        });
        tokenData = await tokenResponse.json();
        console.log("[VK Auth] Token exchange response:", JSON.stringify(tokenData));
      } catch (fetchError) {
        console.error("[VK Auth] Token exchange failed:", fetchError);
        res.redirect("/login?error=exchange_failed");
        return;
      }

      if (tokenData.error || !tokenData.access_token) {
        console.error("[VK Auth] Token exchange error:", tokenData);
        res.redirect("/login?error=exchange_error");
        return;
      }

      const accessToken = tokenData.access_token;
      const userId = tokenData.user_id;
      const userEmail = tokenData.email || null;

      // Получаем информацию о пользователе через VK ID user_info endpoint
      let userName = "";
      try {
        const userInfoParams = new URLSearchParams({
          access_token: accessToken,
          client_id: VK_APP_ID,
        });

        const userInfoResponse = await fetch("https://id.vk.com/oauth2/user_info", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: userInfoParams.toString(),
        });
        const userInfoData = await userInfoResponse.json();
        console.log("[VK Auth] User info response:", JSON.stringify(userInfoData));

        if (userInfoData.user) {
          const vkUser = userInfoData.user;
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
