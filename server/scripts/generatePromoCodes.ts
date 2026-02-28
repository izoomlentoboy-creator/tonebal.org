/**
 * Скрипт для генерации промокодов
 * Используйте: npx tsx server/scripts/generatePromoCodes.ts
 *
 * Генерирует коды с использованием HMAC-SHA256 и ключа "ElizaAirat"
 */

import { generatePromoBatch } from '../utils/promoCode.js';

const BATCH_ID = 'launch-2026';

console.log('=== Генерация промокодов ===');
console.log('Ключ: ElizaAirat');
console.log(`Партия: ${BATCH_ID}`);
console.log('');

// 10 кодов на 1 месяц
const monthlyCodes = generatePromoBatch('monthly', 10, BATCH_ID);
console.log('--- Промокоды на 1 МЕСЯЦ (30 дней) ---');
monthlyCodes.forEach((code, i) => {
  console.log(`  ${i + 1}. ${code}`);
});

console.log('');

// 10 кодов на 12 месяцев
const yearlyCodes = generatePromoBatch('yearly', 10, BATCH_ID);
console.log('--- Промокоды на 12 МЕСЯЦЕВ (365 дней) ---');
yearlyCodes.forEach((code, i) => {
  console.log(`  ${i + 1}. ${code}`);
});

console.log('');
console.log('--- SQL для вставки в базу данных ---');
console.log('');

const allCodes = [
  ...monthlyCodes.map(code => ({ code, planType: 'monthly' })),
  ...yearlyCodes.map(code => ({ code, planType: 'yearly' })),
];

const sqlValues = allCodes
  .map(({ code, planType }) => `  ('${code}', '${planType}', 1, 0, true)`)
  .join(',\n');

console.log(`INSERT INTO promo_codes (code, plan_type, max_uses, used_count, is_active) VALUES`);
console.log(sqlValues + ';');
