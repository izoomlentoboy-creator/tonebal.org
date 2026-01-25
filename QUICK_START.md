# ⚡ Быстрый старт - Обновление проекта

## 🎯 Что нужно сделать

Вы получили обновленные файлы с правильной реализацией webhook YooKassa для домена **https://tonebal.org**

## 📦 Что в архиве

### Обновленные файлы:
- ✅ **server.js** - правильная обработка webhook по требованиям YooKassa
- ✅ **index.html** - обновленная конфигурация для tonebal.org

### Новые инструкции:
- 📘 **WEBHOOK_SETUP.md** - настройка webhook в YooKassa
- 📘 **DOMAIN_SETUP.md** - настройка домена tonebal.org
- 📘 **GITHUB_UPDATE.md** - как обновить проект через GitHub

### Конфигурационные файлы:
- vercel.json, package.json, .gitignore, .env.example и др.

## 🚀 Три простых шага

### Шаг 1: Обновите файлы на GitHub

**Вариант A - Через командную строку:**
```bash
cd ваш-проект
cp /путь/к/архиву/updated/* .
git add .
git commit -m "Update webhook implementation for tonebal.org"
git push origin main
```

**Вариант B - Через GitHub Web:**
1. Откройте https://github.com/ваш-username/tonebal-org
2. Откройте файл `server.js` → нажмите ✏️
3. Замените содержимое на новое из `updated/server.js`
4. Commit changes
5. Повторите для `index.html`

### Шаг 2: Настройте webhook в YooKassa

1. Откройте https://yookassa.ru/my
2. **Интеграция** → **HTTP-уведомления**
3. URL: `https://tonebal.org/api/webhooks/yookassa`
4. События: ✅ payment.succeeded, ✅ payment.canceled, ✅ refund.succeeded
5. Сохранить

### Шаг 3: Настройте домен tonebal.org (если еще не сделали)

1. Vercel → ваш проект → Settings → Domains
2. Add: `tonebal.org`
3. Настройте DNS у регистратора домена
4. Обновите `BASE_URL` в Environment Variables на `https://tonebal.org`
5. Redeploy

## ✅ Проверка

После выполнения всех шагов:

```bash
# 1. Проверьте API
curl https://tonebal.org/api/health

# 2. Откройте страницу оплаты
https://tonebal.org/pay?nosology=paresis&user_id=test123

# 3. Выполните тестовый платеж
# Карта: 5555 5555 5555 4477

# 4. Проверьте логи Vercel
# Должно быть: "✅ Subscription activated"
```

## 📚 Подробные инструкции

- **Настройка webhook:** читайте `WEBHOOK_SETUP.md`
- **Настройка домена:** читайте `DOMAIN_SETUP.md`
- **Обновление через GitHub:** читайте `GITHUB_UPDATE.md`

## 🔑 Основные изменения

### В server.js:

1. ✅ Проверка типа уведомления (`type === 'notification'`)
2. ✅ Верификация платежа через API YooKassa
3. ✅ Проверка IP-адресов отправителя (опционально)
4. ✅ Обработка всех событий: payment.succeeded, payment.canceled, refund.succeeded
5. ✅ Всегда возвращает HTTP 200 (требование YooKassa)
6. ✅ Логирование всех webhook'ов
7. ✅ Правильная активация подписок

### В index.html:

1. ✅ Автоматическое определение API_BASE
2. ✅ Поддержка как Vercel, так и tonebal.org
3. ✅ Правильный return_url для YooKassa

## 🎯 Итоговая конфигурация

| Параметр | Значение |
|----------|----------|
| **Домен** | https://tonebal.org |
| **Webhook URL** | https://tonebal.org/api/webhooks/yookassa |
| **API Health** | https://tonebal.org/api/health |
| **Страница оплаты** | https://tonebal.org/pay |
| **События webhook** | payment.succeeded, payment.canceled, refund.succeeded |

## ⚠️ Важно

1. **Переменные окружения** должны быть установлены в Vercel:
   - `YOOKASSA_SHOP_ID=513198`
   - `YOOKASSA_SECRET_KEY=ваш_ключ`
   - `BASE_URL=https://tonebal.org`

2. **HTTPS обязателен** - YooKassa работает только с HTTPS

3. **Webhook должен возвращать HTTP 200** - иначе YooKassa будет повторять отправку 24 часа

## 📞 Нужна помощь?

- **Webhook не работает?** → читайте `WEBHOOK_SETUP.md`, раздел "Решение проблем"
- **Домен не настраивается?** → читайте `DOMAIN_SETUP.md`
- **Проблемы с GitHub?** → читайте `GITHUB_UPDATE.md`

## 🎉 Готово!

После выполнения всех шагов ваша система будет:
- ✅ Принимать платежи через YooKassa
- ✅ Автоматически получать webhook'и
- ✅ Активировать подписки пользователей
- ✅ Работать на домене tonebal.org

---

**Следующие шаги:**
1. Обновите файлы → 2. Настройте webhook → 3. Настройте домен → 4. Тестируйте! 🚀
