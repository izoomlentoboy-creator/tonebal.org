import { ENV } from "../_core/env";

const YOOKASSA_API_URL = "https://api.yookassa.ru/v3";
const API_TIMEOUT = 25000; // 25 seconds

interface YooKassaAmount {
  value: string;
  currency: string;
}

interface YooKassaConfirmation {
  type: string;
  return_url?: string;
  confirmation_url?: string;
}

interface YooKassaPaymentResponse {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: YooKassaAmount;
  confirmation?: YooKassaConfirmation;
  description?: string;
  metadata?: Record<string, string>;
  created_at: string;
}

interface CreatePaymentParams {
  userId: number;
  returnUrl: string;
  description?: string;
  amount?: number; // Цена в рублях (если не указана, используется subscriptionPrice)
}

/**
 * Получение заголовков авторизации для YooKassa API
 */
function getAuthHeaders(): Record<string, string> {
  const credentials = Buffer.from(
    `${ENV.yookassaShopId}:${ENV.yookassaSecretKey}`
  ).toString("base64");

  return {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  };
}

/**
 * Генерация уникального ключа идемпотентности
 */
function generateIdempotenceKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Создание платежа в YooKassa
 */
export async function createPayment(
  params: CreatePaymentParams
): Promise<{ paymentId: string; confirmationUrl: string } | { error: string }> {
  const { userId, returnUrl, description, amount } = params;

  // Используем переданную цену или дефолтную месячную
  const paymentAmount = amount ?? ENV.subscriptionPrice;
  const paymentDescription = description || `Подписка Tone Balance на ${ENV.subscriptionDays} дней`;

  const paymentData = {
    amount: {
      value: paymentAmount.toFixed(2),
      currency: "RUB",
    },
    confirmation: {
      type: "redirect",
      return_url: returnUrl,
    },
    capture: true,
    description: paymentDescription,
    metadata: {
      user_id: userId.toString(),
      amount: paymentAmount.toString(),
    },
    receipt: {
      customer: {
        email: "customer@tonebalance.app",
      },
      items: [
        {
          description: paymentDescription,
          quantity: "1.00",
          amount: {
            value: paymentAmount.toFixed(2),
            currency: "RUB",
          },
          vat_code: 1,
          payment_mode: "full_payment",
          payment_subject: "service",
        },
      ],
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Idempotence-Key": generateIdempotenceKey(),
      },
      body: JSON.stringify(paymentData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = (await response.json()) as YooKassaPaymentResponse & {
      description?: string;
    };

    if (result.id && result.confirmation?.confirmation_url) {
      console.log(`[YooKassa] Payment created: ${result.id} for user ${userId}`);
      return {
        paymentId: result.id,
        confirmationUrl: result.confirmation.confirmation_url,
      };
    }

    console.error("[YooKassa] Payment creation failed:", result);
    return {
      error: result.description || "Ошибка создания платежа",
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Превышено время ожидания ответа от платёжной системы"
        : "Ошибка соединения с платёжной системой";

    console.error("[YooKassa] Error:", error);
    return { error: message };
  }
}

/**
 * Получение статуса платежа из YooKassa
 */
export async function getPaymentStatus(
  paymentId: string
): Promise<YooKassaPaymentResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}`, {
      method: "GET",
      headers: getAuthHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return (await response.json()) as YooKassaPaymentResponse;
    }

    console.error(
      `[YooKassa] Failed to get payment status: ${response.status}`
    );
    return null;
  } catch (error) {
    console.error("[YooKassa] Error getting payment status:", error);
    return null;
  }
}

/**
 * Проверка IP адреса YooKassa для webhook
 */
export function isYooKassaIP(ip: string): boolean {
  const YOOKASSA_IPS = [
    "185.71.76.",
    "185.71.77.",
    "77.75.153.",
    "77.75.156.",
    "77.75.154.",
  ];

  const cleanIP = ip.replace(/^::ffff:/, "");
  return YOOKASSA_IPS.some((prefix) => cleanIP.startsWith(prefix));
}
