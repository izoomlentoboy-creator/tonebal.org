import { createHmac, randomBytes } from 'crypto';

/**
 * Секретные ключи для генерации криптостойких кодов
 * Eliza - для месячной подписки (30 дней)
 * AiratB - для годовой подписки (365 дней)
 */
const SECRET_KEYS = {
  monthly: 'Eliza',
  yearly: 'AiratB',
} as const;

export type SubscriptionPlan = keyof typeof SECRET_KEYS;

/**
 * Алфавит для кодов (исключены похожие символы: 0,O,1,I,L)
 * Соответствует алфавиту в iOS приложении
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const CHECKSUM_LENGTH = 2;

/**
 * Генерация криптостойкого кода доступа
 * Код состоит из 6 случайных символов + 2 символа контрольной суммы
 * Формат: XXXXXX + CC где CC - контрольная сумма на основе HMAC-SHA256
 *
 * @param plan - тип подписки: 'monthly' (30 дней) или 'yearly' (365 дней)
 */
export function generateAccessCode(plan: SubscriptionPlan = 'monthly'): string {
  const secretKey = SECRET_KEYS[plan];

  // Генерируем 6 случайных символов (первая часть кода)
  const baseLength = CODE_LENGTH - CHECKSUM_LENGTH;
  let baseCode = '';

  const randomBuffer = randomBytes(baseLength);
  for (let i = 0; i < baseLength; i++) {
    const index = randomBuffer[i] % ALPHABET.length;
    baseCode += ALPHABET[index];
  }

  // Вычисляем контрольную сумму (2 символа)
  const checksum = computeChecksum(baseCode, secretKey);

  // Полный код: 6 символов + 2 символа контрольной суммы = 8 символов
  const fullCode = baseCode + checksum;

  // Возвращаем в формате XXXX-XXXX (без дефиса для хранения)
  return fullCode;
}

/**
 * Вычисление контрольной суммы на основе HMAC-SHA256
 * Алгоритм идентичен iOS приложению для совместимости
 */
function computeChecksum(baseCode: string, secretKey: string): string {
  const hmac = createHmac('sha256', secretKey);
  hmac.update(baseCode);
  const hash = hmac.digest();

  let checksum = '';
  for (let i = 0; i < CHECKSUM_LENGTH; i++) {
    const index = hash[i] % ALPHABET.length;
    checksum += ALPHABET[index];
  }

  return checksum;
}

/**
 * Валидация кода доступа и определение типа подписки
 * Проверяет формат, символы и контрольную сумму для обоих типов ключей
 *
 * @returns объект с полями valid, plan (если валиден), error (если невалиден)
 */
export function validateAccessCode(code: string): {
  valid: boolean;
  plan?: SubscriptionPlan;
  days?: number;
  error?: string;
} {
  // Очищаем код от дефисов и пробелов
  const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();

  // Проверяем длину
  if (cleanCode.length !== CODE_LENGTH) {
    return { valid: false, error: 'Invalid code length' };
  }

  // Проверяем символы
  for (let i = 0; i < cleanCode.length; i++) {
    if (!ALPHABET.includes(cleanCode[i])) {
      return { valid: false, error: 'Invalid characters in code' };
    }
  }

  // Извлекаем базовый код и предоставленную контрольную сумму
  const baseCode = cleanCode.substring(0, CODE_LENGTH - CHECKSUM_LENGTH);
  const providedChecksum = cleanCode.substring(CODE_LENGTH - CHECKSUM_LENGTH);

  // Проверяем контрольную сумму для месячной подписки (Eliza)
  const monthlyChecksum = computeChecksum(baseCode, SECRET_KEYS.monthly);
  if (providedChecksum === monthlyChecksum) {
    return { valid: true, plan: 'monthly', days: 30 };
  }

  // Проверяем контрольную сумму для годовой подписки (AiratB)
  const yearlyChecksum = computeChecksum(baseCode, SECRET_KEYS.yearly);
  if (providedChecksum === yearlyChecksum) {
    return { valid: true, plan: 'yearly', days: 365 };
  }

  // Ни один ключ не подошёл
  return { valid: false, error: 'Invalid checksum' };
}

/**
 * Проверка формата кода доступа (без валидации контрольной суммы)
 */
export function isValidAccessCodeFormat(code: string): boolean {
  const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();
  if (cleanCode.length !== CODE_LENGTH) return false;
  for (let i = 0; i < cleanCode.length; i++) {
    if (!ALPHABET.includes(cleanCode[i])) return false;
  }
  return true;
}

/**
 * Нормализация кода (удаление дефисов, приведение к верхнему регистру)
 */
export function normalizeAccessCode(code: string): string {
  return code.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Форматирование кода для отображения (XXXX-XXXX)
 */
export function formatAccessCode(code: string): string {
  const clean = normalizeAccessCode(code);
  if (clean.length !== CODE_LENGTH) return code;
  return `${clean.substring(0, 4)}-${clean.substring(4, 8)}`;
}

/**
 * Вычисление даты истечения подписки
 * @param daysToAdd - количество дней для добавления
 * @param baseDate - базовая дата (если не указана, используется текущая дата)
 */
export function calculateExpiryDate(daysToAdd: number = 30, baseDate?: Date): Date {
  // Если есть базовая дата и она в будущем - добавляем дни к ней
  // Иначе добавляем к текущей дате
  const now = new Date();
  const base = baseDate && new Date(baseDate) > now ? new Date(baseDate) : now;
  base.setDate(base.getDate() + daysToAdd);
  return base;
}

/**
 * Вычисление оставшихся дней до истечения
 */
export function getDaysRemaining(expiresAt: Date): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Получить количество дней для типа подписки
 */
export function getDaysForPlan(plan: SubscriptionPlan): number {
  return plan === 'yearly' ? 365 : 30;
}
