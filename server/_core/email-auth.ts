import type { Express, Request, Response } from "express";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import * as db from "../db.js";
import { getSessionCookieOptions } from "./cookies.js";
import { sdk } from "./sdk.js";
import { ENV } from "./env.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const BCRYPT_ROUNDS = 10;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function registerEmailAuthRoutes(app: Express) {
  // Registration
  app.post("/api/auth/email/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email и пароль обязательны" });
      }

      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Некорректный email" });
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов` });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user with this email already exists
      const existing = await db.getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: "Пользователь с этим email уже существует" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user with openId = "email_<random>"
      const openId = `email_${crypto.randomUUID()}`;

      await db.upsertUser({
        openId,
        name: name || null,
        email: normalizedEmail,
        passwordHash,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Create email verification token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.createEmailToken({
        userId: (await db.getUserByOpenId(openId))!.id,
        token,
        type: "verify",
        expiresAt,
      });

      // Send verification email
      try {
        await sendVerificationEmail(normalizedEmail, token);
      } catch (emailErr) {
        console.warn("[Email Auth] Failed to send verification email:", emailErr);
      }

      // Create session immediately (user can use app before verifying)
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, emailVerified: false });
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

      // Update last sign in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Create session
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

  // Email verification
  app.get("/api/auth/email/verify", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        return res.redirect("/login?error=invalid_token");
      }

      const emailToken = await db.getEmailToken(token, "verify");

      if (!emailToken) {
        return res.redirect("/login?error=invalid_token");
      }

      if (new Date() > new Date(emailToken.expiresAt)) {
        return res.redirect("/login?error=token_expired");
      }

      if (emailToken.usedAt) {
        return res.redirect("/login?error=token_used");
      }

      // Mark email as verified
      await db.markEmailVerified(emailToken.userId);
      await db.markEmailTokenUsed(emailToken.id);

      res.redirect("/dashboard?verified=true");
    } catch (error) {
      console.error("[Email Auth] Verify error:", error);
      res.redirect("/login?error=verify_failed");
    }
  });

  // Resend verification email
  app.post("/api/auth/email/resend-verify", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email обязателен" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.getUserByEmail(normalizedEmail);

      if (!user) {
        // Don't reveal if user exists
        return res.json({ success: true });
      }

      if (user.emailVerified) {
        return res.json({ success: true, alreadyVerified: true });
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db.createEmailToken({
        userId: user.id,
        token,
        type: "verify",
        expiresAt,
      });

      try {
        await sendVerificationEmail(normalizedEmail, token);
      } catch (emailErr) {
        console.warn("[Email Auth] Failed to resend verification:", emailErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[Email Auth] Resend verify error:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Forgot password - send reset email
  app.post("/api/auth/email/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email обязателен" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.getUserByEmail(normalizedEmail);

      // Always return success (don't reveal if user exists)
      if (!user || !user.passwordHash) {
        return res.json({ success: true });
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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

      if (!emailToken) {
        return res.status(400).json({ error: "Неверная или истекшая ссылка" });
      }

      if (new Date() > new Date(emailToken.expiresAt)) {
        return res.status(400).json({ error: "Ссылка для сброса истекла" });
      }

      if (emailToken.usedAt) {
        return res.status(400).json({ error: "Ссылка уже использована" });
      }

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
