import nodemailer from "nodemailer";
import { ENV } from "../_core/env.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.yandex.ru",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@tonebal.org";
const FROM_NAME = "ToneBalance";

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${ENV.baseUrl}/api/auth/email/verify?token=${token}`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: "Подтвердите email — ToneBalance",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Подтверждение email</h2>
        <p style="color: #475569; line-height: 1.6;">
          Вы зарегистрировались в ToneBalance. Для завершения регистрации подтвердите ваш email:
        </p>
        <a href="${verifyUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 12px; font-weight: 500;">
          Подтвердить email
        </a>
        <p style="color: #94a3b8; font-size: 14px;">
          Если вы не регистрировались — просто проигнорируйте это письмо.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          © ${new Date().getFullYear()} ToneBalance
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${ENV.baseUrl}/login?mode=reset-password&token=${token}`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: "Сброс пароля — ToneBalance",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Сброс пароля</h2>
        <p style="color: #475569; line-height: 1.6;">
          Вы запросили сброс пароля в ToneBalance. Нажмите кнопку ниже, чтобы установить новый пароль:
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 12px; font-weight: 500;">
          Сбросить пароль
        </a>
        <p style="color: #94a3b8; font-size: 14px;">
          Ссылка действительна 1 час. Если вы не запрашивали сброс — проигнорируйте это письмо.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          © ${new Date().getFullYear()} ToneBalance
        </p>
      </div>
    `,
  });
}
