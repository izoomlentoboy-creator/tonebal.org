import { createHmac, randomBytes } from 'crypto';

/**
 * Секретный ключ для генерации криптостойких кодов
 * Используется для создания контрольной суммы, которая валидируется на iOS
 */
const SECRET_KEY = 'Eliza';

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
 */
export function generateAccessCode(): string {
  // Генерируем 6 случайных символов (первая часть кода)
  const baseLength = CODE_LENGTH - CHECKSUM_LENGTH;
  let baseCode = '';

  const randomBuffer = randomBytes(baseLength);
  for (let i = 0; i < baseLength; i++) {
    const index = randomBuffer[i] % ALPHABET.length;
    baseCode += ALPHABET[index];
  }

  // Вычисляем контрольную сумму (2 символа)
  const checksum = computeChecksum(baseCode);

  // Полный код: 6 символов + 2 символа контрольной суммы = 8 символов
  const fullCode = baseCode + checksum;

  // Возвращаем в формате XXXX-XXXX
  return `${fullCode.substring(0, 4)}-${fullCode.substring(4, 8)}`;
}

/**
 * Вычисление контрольной суммы на основе HMAC-SHA256
 * Алгоритм идентичен iOS приложению для совместимости
 */
function computeChecksum(baseCode: string): string {
  const hmac = createHmac('sha256', SECRET_KEY);
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
 * Валидация кода доступа
 * Проверяет формат, символы и контрольную сумму
 */
export function validateAccessCode(code: string): { valid: boolean; error?: string } {
  // Очищаем код от дефисов и пробелов
  const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();

  // Проверяем длину
  if (cleanCode.length !== CODE_LENGTH) {
    return { valid: false, error: 'Invalid code length' };
  }

  // Проверяем символы
  for (const char of cleanCode) {
    if (!ALPHABET.includes(char)) {
      return { valid: false, error: 'Invalid characters in code' };
    }
  }

  // Проверяем контрольную сумму
  const baseCode = cleanCode.substring(0, CODE_LENGTH - CHECKSUM_LENGTH);
  const providedChecksum = cleanCode.substring(CODE_LENGTH - CHECKSUM_LENGTH);
  const expectedChecksum = computeChecksum(baseCode);

  if (providedChecksum !== expectedChecksum) {
    return { valid: false, error: 'Invalid checksum' };
  }

  return { valid: true };
}

/**
 * Проверка формата кода доступа (без валидации контрольной суммы)
 */
export function isValidAccessCodeFormat(code: string): boolean {
  const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();
  return cleanCode.length === CODE_LENGTH &&
    [...cleanCode].every(char => ALPHABET.includes(char));
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
 * Вычисление даты истечения подписки (30 дней от текущей даты)
 */
export function calculateExpiryDate(daysFromNow: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
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
