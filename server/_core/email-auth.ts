import type { Express, Request, Response } from "express";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import * as db from "../db.js";
import { getSessionCookieOptions } from "./cookies.js";
import { sdk } from "./sdk.js";
import { sendVerificationCode, sendWelcomeEmail, sendPasswordResetEmail } from "../utils/email.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const BCRYPT_ROUNDS = 10;
const CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const CODE_COOLDOWN_MS = 60 * 1000; // 1 minute between resends

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function registerEmailAuthRoutes(app: Express) {
  // Step 1: Send verification code to email
  app.post("/api/auth/email/send-code", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email обязателен" });
      }

      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Некорректный email" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existing = await db.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: "Пользователь с этим email уже существует" });
      }

      // Check cooldown — don't spam codes
      const recentCode = await db.getVerificationCode(normalizedEmail);
      if (recentCode) {
        const elapsed = Date.now() - new Date(recentCode.createdAt).getTime();
        if (elapsed < CODE_COOLDOWN_MS) {
          const waitSeconds = Math.ceil((CODE_COOLDOWN_MS - elapsed) / 1000);
          return res.status(429).json({ error: `Подождите ${waitSeconds} сек. перед повторной отправкой` });
        }
      }

      const code = generateCode();
      const token = `code_${code}_${crypto.randomBytes(8).toString("hex")}`;

      await db.createEmailToken({
        email: normalizedEmail,
        token,
        type: "verify_code",
        expiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
      });

      try {
        await sendVerificationCode(normalizedEmail, code);
      } catch (emailErr) {
        console.error("[Email Auth] Failed to send verification code:", emailErr);
        return res.status(500).json({ error: "Не удалось отправить письмо. Проверьте email и попробуйте снова." });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Email Auth] Send code error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Step 2: Register with verified code
  app.post("/api/auth/email/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, code, emailConsent } = req.body;

      if (!email || !password || !code) {
        return res.status(400).json({ error: "Email, пароль и код подтверждения обязательны" });
      }

      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Некорректный email" });
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Verify the code
      const emailToken = await db.getVerificationCode(normalizedEmail);

      if (!emailToken) {
        return res.status(400).json({ error: "Код не найден. Запросите новый код." });
      }

      if (new Date() > new Date(emailToken.expiresAt)) {
        return res.status(400).json({ error: "Код истёк. Запросите новый код." });
      }

      // Extract 6-digit code from token field (format: code_XXXXXX_random)
      const storedCode = emailToken.token.split("_")[1];
      if (storedCode !== code) {
        return res.status(400).json({ error: "Неверный код подтверждения" });
      }

      // Check if user already exists (race condition protection)
      const existing = await db.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: "Пользователь с этим email уже существует" });
      }

      // Mark code as used
      await db.markEmailTokenUsed(emailToken.id);

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const openId = `email_${crypto.randomUUID()}`;

      await db.upsertUser({
        openId,
        name: name || null,
        email: normalizedEmail,
        passwordHash,
        emailVerified: true,
        emailConsent: emailConsent === true,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Create session
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Send welcome email (non-blocking)
      sendWelcomeEmail(normalizedEmail, name || null).catch(err => {
        console.warn("[Email Auth] Failed to send welcome email:", err);
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[Email Auth] Register error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Login
  app.post("/api/auth/email/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email и пароль обязательны" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.getUserByEmail(normalizedEmail);

      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Неверный email или пароль" });
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ error: "Неверный email или пароль" });
      }

      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true });
    } catch (error) {
      console.error("[Email Auth] Login error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Email verification (legacy link-based)
  app.get("/api/auth/email/verify", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.redirect("/login?error=invalid_token");

      const emailToken = await db.getEmailToken(token, "verify");
      if (!emailToken) return res.redirect("/login?error=invalid_token");
      if (new Date() > new Date(emailToken.expiresAt)) return res.redirect("/login?error=token_expired");
      if (emailToken.usedAt) return res.redirect("/login?error=token_used");

      if (emailToken.userId) {
        await db.markEmailVerified(emailToken.userId);
      }
      await db.markEmailTokenUsed(emailToken.id);
      res.redirect("/dashboard?verified=true");
    } catch (error) {
      console.error("[Email Auth] Verify error:", error);
      res.redirect("/login?error=verify_failed");
    }
  });

  // Forgot password
  app.post("/api/auth/email/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email обязателен" });

      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.getUserByEmail(normalizedEmail);

      if (!user || !user.passwordHash) {
        return res.json({ success: true });
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.createEmailToken({
        userId: user.id,
        token,
        type: "reset",
        expiresAt,
      });

      try {
        await sendPasswordResetEmail(normalizedEmail, token);
      } catch (emailErr) {
        console.warn("[Email Auth] Failed to send reset email:", emailErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Email Auth] Forgot password error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Reset password
  app.post("/api/auth/email/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: "Токен и пароль обязательны" });
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
      }

      const emailToken = await db.getEmailToken(token, "reset");
      if (!emailToken) return res.status(400).json({ error: "Неверная или истекшая ссылка" });
      if (new Date() > new Date(emailToken.expiresAt)) return res.status(400).json({ error: "Ссылка для сброса истекла" });
      if (emailToken.usedAt) return res.status(400).json({ error: "Ссылка уже использована" });
      if (!emailToken.userId) return res.status(400).json({ error: "Неверная ссылка" });

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await db.updateUserPassword(emailToken.userId, passwordHash);
      await db.markEmailTokenUsed(emailToken.id);

      res.json({ success: true });
    } catch (error) {
      console.error("[Email Auth] Reset password error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });
}
