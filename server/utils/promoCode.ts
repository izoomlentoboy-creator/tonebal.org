import { createHmac } from 'crypto';

/**
 * Система генерации промокодов на основе HMAC-SHA256
 *
 * Алгоритм:
 * 1. Берём секретный ключ "ElizaAirat"
 * 2. Формируем входные данные: planType + sequence number
 * 3. Вычисляем HMAC-SHA256 от этих данных
 * 4. Конвертируем хеш в читаемый код из алфавита (без похожих символов)
 * 5. Добавляем префикс плана: M- (monthly) или Y- (yearly)
 * 6. Итоговый формат: M-XXXXXXXX или Y-XXXXXXXX
 *
 * Код детерминистичен: одинаковые входные данные всегда дают один код.
 * Без знания ключа невозможно сгенерировать валидный код.
 */

const PROMO_SECRET_KEY = 'ElizaAirat';

/** Алфавит без похожих символов (0/O, 1/I/L) */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_BODY_LENGTH = 8;

export type PromoPlanType = 'monthly' | 'yearly';

/**
 * Генерация одного промокода
 * @param planType - тип подписки
 * @param sequence - порядковый номер (уникальный для каждого кода)
 * @param batchId - идентификатор партии (для группировки)
 */
export function generatePromoCode(
  planType: PromoPlanType,
  sequence: number,
  batchId: string = 'default'
): string {
  const prefix = planType === 'yearly' ? 'Y' : 'M';

  // Формируем входные данные для HMAC
  const input = `${PROMO_SECRET_KEY}:${planType}:${batchId}:${sequence}`;

  // Вычисляем HMAC-SHA256
  const hmac = createHmac('sha256', PROMO_SECRET_KEY);
  hmac.update(input);
  const hash = hmac.digest();

  // Конвертируем хеш в код
  let code = '';
  for (let i = 0; i < CODE_BODY_LENGTH; i++) {
    const index = hash[i] % ALPHABET.length;
    code += ALPHABET[index];
  }

  return `${prefix}-${code}`;
}

/**
 * Верификация формата промокода
 * Проверяет, что код соответствует ожидаемому формату
 */
export function isValidPromoFormat(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  // Формат: M-XXXXXXXX или Y-XXXXXXXX
  if (!/^[MY]-[A-Z2-9]{8}$/.test(normalized)) return false;
  // Проверяем что все символы из алфавита
  const body = normalized.substring(2);
  for (const char of body) {
    if (!ALPHABET.includes(char)) return false;
  }
  return true;
}

/**
 * Определить тип плана из промокода
 */
export function getPlanTypeFromPromo(code: string): PromoPlanType | null {
  const normalized = code.trim().toUpperCase();
  if (normalized.startsWith('M-')) return 'monthly';
  if (normalized.startsWith('Y-')) return 'yearly';
  return null;
}

/**
 * Нормализация промокода (uppercase, trim)
 */
export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Генерация пакета промокодов
 * @param planType - тип подписки
 * @param count - количество кодов
 * @param batchId - идентификатор партии
 */
export function generatePromoBatch(
  planType: PromoPlanType,
  count: number,
  batchId: string = 'batch-v1'
): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generatePromoCode(planType, i + 1, batchId));
  }
  return codes;
}
