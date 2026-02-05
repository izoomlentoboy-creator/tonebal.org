import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import * as crypto from "crypto";
import { parse as parseCookieHeader } from "cookie";

const VK_APP_ID = "54441764";
const VK_PKCE_COOKIE = "vk_pkce";

/**
 * Авторизация для ToneBalance
 * Поддерживает: VK ID с PKCE
 */

// Генерация code_verifier для PKCE
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Генерация code_challenge из code_verifier
function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return hash.toString("base64url");
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

  // VK ID авторизация - начало (генерация PKCE и редирект на VK)
  app.get("/api/auth/vk/start", (req: Request, res: Response) => {
    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      const state = generateState();

      // Сохраняем code_verifier и state в cookie (5 минут)
      const pkceData = JSON.stringify({ codeVerifier, state });
      res.cookie(VK_PKCE_COOKIE, pkceData, {
        httpOnly: true,
        secure: ENV.isProduction,
        sameSite: "lax",
        maxAge: 5 * 60 * 1000, // 5 минут
        path: "/",
      });

      // Формируем URL для VK ID
      const params = new URLSearchParams({
        client_id: VK_APP_ID,
        redirect_uri: `${ENV.baseUrl}/api/auth/vk/callback`,
        response_type: "code",
        scope: "email",
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: "s256",
      });

      const authUrl = `https://id.vk.com/authorize?${params.toString()}`;
      res.redirect(authUrl);
    } catch (error) {
      console.error("[VK Auth] Start failed:", error);
      res.redirect("/login?error=start_failed");
    }
  });

  // VK ID callback (обработка ответа от VK)
  app.get("/api/auth/vk/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, device_id } = req.query;

      if (!code || typeof code !== "string") {
        console.error("[VK Auth] No code provided");
        res.redirect("/login?error=no_code");
        return;
      }

      // Получаем PKCE данные из cookie
      const cookies = req.headers.cookie ? parseCookieHeader(req.headers.cookie) : {};
      const pkceDataStr = cookies[VK_PKCE_COOKIE];
      let codeVerifier: string | null = null;
      let savedState: string | null = null;

      if (pkceDataStr) {
        try {
          const pkceData = JSON.parse(pkceDataStr);
          codeVerifier = pkceData.codeVerifier;
          savedState = pkceData.state;
        } catch {
          console.warn("[VK Auth] Failed to parse PKCE cookie");
        }
      }

      // Очищаем PKCE cookie
      res.clearCookie(VK_PKCE_COOKIE, { path: "/" });

      // Проверяем state если есть
      if (savedState && state && state !== savedState) {
        console.error("[VK Auth] State mismatch");
        res.redirect("/login?error=state_mismatch");
        return;
      }

      // Пробуем VK ID token exchange с PKCE
      let tokenData: any = null;

      if (codeVerifier) {
        try {
          const tokenResponse = await fetch("https://id.vk.com/oauth2/auth", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: code,
              client_id: VK_APP_ID,
              redirect_uri: `${ENV.baseUrl}/api/auth/vk/callback`,
              code_verifier: codeVerifier,
              device_id: (device_id as string) || "",
            }),
          });
          tokenData = await tokenResponse.json();
          console.log("[VK Auth] VK ID token response:", JSON.stringify(tokenData));
        } catch (fetchError) {
          console.error("[VK Auth] VK ID token fetch failed:", fetchError);
        }
      }

      // Если VK ID не сработал, пробуем старый OAuth
      if (!tokenData || tokenData.error || !tokenData.access_token) {
        const vkAppSecret = process.env.VK_APP_SECRET;
        if (vkAppSecret) {
          try {
            const tokenUrl = new URL("https://oauth.vk.com/access_token");
            tokenUrl.searchParams.set("client_id", VK_APP_ID);
            tokenUrl.searchParams.set("client_secret", vkAppSecret);
            tokenUrl.searchParams.set("redirect_uri", `${ENV.baseUrl}/api/auth/vk/callback`);
            tokenUrl.searchParams.set("code", code);
            if (device_id && typeof device_id === "string") {
              tokenUrl.searchParams.set("device_id", device_id);
            }

            const tokenResponse = await fetch(tokenUrl.toString());
            tokenData = await tokenResponse.json();
            console.log("[VK Auth] Legacy OAuth response:", JSON.stringify(tokenData));
          } catch (fetchError) {
            console.error("[VK Auth] Legacy OAuth fetch failed:", fetchError);
          }
        }
      }

      if (!tokenData || tokenData.error || !tokenData.access_token) {
        console.error("[VK Auth] Token exchange failed:", tokenData);
        res.redirect("/login?error=token_failed");
        return;
      }

      const userId = tokenData.user_id;
      const accessToken = tokenData.access_token;
      const userEmail = tokenData.email || null;

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
