import { ENV } from "../_core/env.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FROM_NAME = "ToneBalance";

async function sendMail(opts: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

// ─── Base email template ───────────────────────────────────────────────────────

function emailLayout(content: string): string {
  const year = new Date().getFullYear();
  const logoUrl = `${ENV.baseUrl}/icon-512.png`;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ToneBalance</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f0ff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; -webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f0ff; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; width:100%; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 32px rgba(124,58,237,0.10);">

          <!-- Header -->
          <tr>
            <td style="background-color:#7C3AED; padding:28px 32px; text-align:center;">
              <img src="${logoUrl}" width="56" height="56" alt="ToneBalance" style="display:inline-block; border-radius:14px; border:2px solid rgba(255,255,255,0.25);" />
              <p style="color:#ffffff; font-size:18px; font-weight:700; margin:10px 0 0; letter-spacing:0.3px;">ToneBalance</p>
              <p style="color:rgba(255,255,255,0.7); font-size:13px; margin:4px 0 0; font-weight:400;">Голосовая реабилитация</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 32px 24px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#faf8ff; padding:20px 32px; text-align:center; border-top:1px solid #ede8f5;">
              <p style="color:#a1a1aa; font-size:12px; margin:0; line-height:1.5;">
                &copy; ${year} ToneBalance. Все права защищены.
              </p>
              <p style="color:#c4b5d8; font-size:11px; margin:6px 0 0; line-height:1.4;">
                Это автоматическое письмо от сервиса tonebal.org
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Verification code email ───────────────────────────────────────────────────

export async function sendVerificationCode(email: string, code: string) {
  const content = `
    <h2 style="color:#1e293b; font-size:20px; margin:0 0 8px; font-weight:700;">Подтверждение регистрации</h2>
    <p style="color:#64748b; font-size:15px; line-height:1.6; margin:0 0 24px;">
      Здравствуйте! Для завершения регистрации в ToneBalance введите код подтверждения:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:16px 0 24px;">
          <div style="display:inline-block; background-color:#f5f0ff; border:2px solid #e9e0ff; border-radius:16px; padding:20px 40px;">
            <span style="font-size:36px; font-weight:800; color:#7C3AED; letter-spacing:8px; font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;">${code}</span>
          </div>
        </td>
      </tr>
    </table>

    <p style="color:#64748b; font-size:14px; line-height:1.6; margin:0 0 8px;">
      Код действителен <strong style="color:#1e293b;">15 минут</strong>. Если вы не запрашивали регистрацию, просто проигнорируйте это письмо.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px; border-top:1px solid #f1f5f9; padding-top:16px;">
      <tr>
        <td>
          <p style="color:#94a3b8; font-size:13px; line-height:1.5; margin:0;">
            С уважением,<br/>
            <strong style="color:#64748b;">Команда ToneBalance</strong>
          </p>
        </td>
      </tr>
    </table>`;

  await sendMail({
    to: email,
    subject: `${code} — код подтверждения ToneBalance`,
    html: emailLayout(content),
  });
}

// ─── Welcome email after registration ──────────────────────────────────────────

export async function sendWelcomeEmail(email: string, name: string | null) {
  const greeting = name ? `${name}, добро` : "Добро";

  const content = `
    <h2 style="color:#1e293b; font-size:20px; margin:0 0 8px; font-weight:700;">${greeting} пожаловать в ToneBalance!</h2>
    <p style="color:#64748b; font-size:15px; line-height:1.6; margin:0 0 20px;">
      Мы рады приветствовать вас в нашем сервисе голосовой реабилитации. Ваш аккаунт успешно создан и готов к работе.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f5ff; border-radius:12px; padding:0;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="color:#1e293b; font-size:15px; font-weight:600; margin:0 0 12px;">Что доступно сейчас:</p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:4px 0; color:#16a34a; font-size:14px; width:24px; vertical-align:top;">&#10003;</td>
              <td style="padding:4px 0 4px 8px; color:#475569; font-size:14px;">Программа &laquo;Введение&raquo; &mdash; бесплатно</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#16a34a; font-size:14px; width:24px; vertical-align:top;">&#10003;</td>
              <td style="padding:4px 0 4px 8px; color:#475569; font-size:14px;">Дыхательная гимнастика &mdash; бесплатно</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#16a34a; font-size:14px; width:24px; vertical-align:top;">&#10003;</td>
              <td style="padding:4px 0 4px 8px; color:#475569; font-size:14px;">Отслеживание прогресса</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#16a34a; font-size:14px; width:24px; vertical-align:top;">&#10003;</td>
              <td style="padding:4px 0 4px 8px; color:#475569; font-size:14px;">Синхронизация с мобильным приложением</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
      <tr>
        <td align="center">
          <a href="${ENV.baseUrl}/dashboard" style="display:inline-block; padding:14px 36px; background-color:#7C3AED; color:#ffffff; text-decoration:none; border-radius:12px; font-weight:600; font-size:15px;">
            Начать занятия
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px; border-top:1px solid #f1f5f9; padding-top:16px;">
      <tr>
        <td>
          <p style="color:#94a3b8; font-size:13px; line-height:1.5; margin:0;">
            Если у вас возникнут вопросы, мы всегда на связи.<br/>
            С уважением,<br/>
            <strong style="color:#64748b;">Команда ToneBalance</strong>
          </p>
        </td>
      </tr>
    </table>`;

  await sendMail({
    to: email,
    subject: "Добро пожаловать в ToneBalance!",
    html: emailLayout(content),
  });
}

// ─── Password reset email ──────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${ENV.baseUrl}/login?mode=reset-password&token=${token}`;

  const content = `
    <h2 style="color:#1e293b; font-size:20px; margin:0 0 8px; font-weight:700;">Сброс пароля</h2>
    <p style="color:#64748b; font-size:15px; line-height:1.6; margin:0 0 24px;">
      Вы запросили сброс пароля для вашего аккаунта ToneBalance. Нажмите кнопку ниже, чтобы установить новый пароль:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${resetUrl}" style="display:inline-block; padding:14px 36px; background-color:#7C3AED; color:#ffffff; text-decoration:none; border-radius:12px; font-weight:600; font-size:15px;">
            Сбросить пароль
          </a>
        </td>
      </tr>
    </table>

    <p style="color:#64748b; font-size:14px; line-height:1.6; margin:0 0 8px;">
      Ссылка действительна <strong style="color:#1e293b;">1 час</strong>. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо &mdash; ваш пароль останется прежним.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px; border-top:1px solid #f1f5f9; padding-top:16px;">
      <tr>
        <td>
          <p style="color:#94a3b8; font-size:13px; line-height:1.5; margin:0;">
            С уважением,<br/>
            <strong style="color:#64748b;">Команда ToneBalance</strong>
          </p>
        </td>
      </tr>
    </table>`;

  await sendMail({
    to: email,
    subject: "Сброс пароля — ToneBalance",
    html: emailLayout(content),
  });
}

// ─── Subscription expiry reminder email ────────────────────────────────────────

export async function sendSubscriptionExpiryReminder(
  email: string,
  name: string | null,
  daysRemaining: number,
  accessCode: string
) {
  const greeting = name || "Уважаемый пользователь";
  const daysWord = getDaysWord(daysRemaining);
  const urgencyBg = daysRemaining <= 1 ? "#fef2f2" : "#fff7ed";
  const urgencyBorder = daysRemaining <= 1 ? "#fecaca" : "#fed7aa";
  const urgencyColor = daysRemaining <= 1 ? "#dc2626" : "#ea580c";

  const content = `
    <h2 style="color:#1e293b; font-size:20px; margin:0 0 8px; font-weight:700;">Срок подписки истекает</h2>
    <p style="color:#64748b; font-size:15px; line-height:1.6; margin:0 0 20px;">
      ${greeting}, напоминаем вам, что до окончания вашей подписки в ToneBalance осталось:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:8px 0 20px;">
          <div style="display:inline-block; background-color:${urgencyBg}; border:2px solid ${urgencyBorder}; border-radius:16px; padding:16px 32px;">
            <span style="font-size:32px; font-weight:800; color:${urgencyColor};">${daysRemaining}</span>
            <span style="font-size:16px; color:${urgencyColor}; font-weight:600; margin-left:8px;">${daysWord}</span>
          </div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f5ff; border-radius:12px;">
      <tr>
        <td style="padding:16px 24px;">
          <p style="color:#475569; font-size:14px; margin:0 0 4px;">Ваш код доступа для приложения:</p>
          <p style="font-size:18px; font-weight:700; color:#7C3AED; letter-spacing:2px; margin:4px 0 0; font-family:'SF Mono',SFMono-Regular,Consolas,monospace;">${accessCode}</p>
        </td>
      </tr>
    </table>

    <p style="color:#64748b; font-size:14px; line-height:1.6; margin:16px 0 0;">
      После истечения подписки доступ к платным программам будет ограничен. Продлите подписку, чтобы продолжить занятия без перерыва.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
      <tr>
        <td align="center">
          <a href="${ENV.baseUrl}/payment" style="display:inline-block; padding:14px 36px; background-color:#7C3AED; color:#ffffff; text-decoration:none; border-radius:12px; font-weight:600; font-size:15px;">
            Продлить подписку
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px; border-top:1px solid #f1f5f9; padding-top:16px;">
      <tr>
        <td>
          <p style="color:#94a3b8; font-size:13px; line-height:1.5; margin:0;">
            Вы получили это письмо, так как дали согласие на рассылку уведомлений.<br/>
            С уважением,<br/>
            <strong style="color:#64748b;">Команда ToneBalance</strong>
          </p>
        </td>
      </tr>
    </table>`;

  await sendMail({
    to: email,
    subject: `Подписка истекает через ${daysRemaining} ${daysWord} — ToneBalance`,
    html: emailLayout(content),
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getDaysWord(days: number): string {
  const abs = Math.abs(days);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod100 >= 11 && mod100 <= 14) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}
