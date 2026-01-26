# 💳 ToneBalance Payment System

Система оплаты подписок для приложения ToneBalance с интеграцией YooKassa.

## 🎯 Возможности

- ✅ Прием платежей через YooKassa (банковские карты, СБП, SberPay)
- ✅ Управление подписками на программы реабилитации
- ✅ Webhook-интеграция для автоматической активации подписок
- ✅ Адаптивный дизайн для мобильных устройств
- ✅ Интеграция с iOS приложением через URL Scheme
- ✅ Тестовый и продакшн режимы

## 🚀 Быстрый старт

### Вариант 1: Развертывание на Vercel (рекомендуется)

1. **Форкните или клонируйте репозиторий:**
```bash
git clone https://github.com/ваш-username/tonebalance-payment.git
cd tonebalance-payment
```

2. **Разверните на Vercel:**
   - Откройте https://vercel.com/new
   - Импортируйте репозиторий
   - Vercel автоматически определит настройки
   - Нажмите "Deploy"

3. **Настройте переменные окружения в Vercel:**
   - `YOOKASSA_SHOP_ID` - ID вашего магазина в YooKassa
   - `YOOKASSA_SECRET_KEY` - Секретный ключ из ЛК YooKassa
   - `BASE_URL` - URL вашего развернутого приложения

4. **Настройте Webhook в YooKassa:**
   - URL: `https://ваш-домен.vercel.app/api/webhooks/yookassa`
   - События: `payment.succeeded`, `payment.canceled`

### Вариант 2: Локальный запуск

```bash
# Установите зависимости
npm install

# Создайте .env файл
cp .env.example .env

# Отредактируйте .env и добавьте ваши ключи
nano .env

# Запустите сервер
npm start
```

Сервер будет доступен на http://localhost:3000

## 📁 Структура проекта

```
tonebalance-payment/
├── index.html          # Страница оплаты (фронтенд)
├── server.js           # Backend сервер (Express + YooKassa API)
├── package.json        # Зависимости Node.js
├── vercel.json         # Конфигурация для Vercel
├── railway.json        # Конфигурация для Railway
├── .env.example        # Пример переменных окружения
├── .gitignore          # Игнорируемые файлы
├── DEPLOY.md           # Подробная инструкция по развертыванию
├── QUICKSTART.md       # Быстрый старт
└── README.md           # Этот файл
```

## 🔧 API Endpoints

### Платежи

- `POST /api/payments/create` - Создание платежа
- `GET /api/payments/status/:payment_id` - Проверка статуса платежа
- `POST /api/webhooks/yookassa` - Webhook для YooKassa

### Подписки

- `GET /api/subscriptions/:user_id` - Получить все подписки пользователя
- `GET /api/subscriptions/:user_id/:nosology` - Проверить подписку на конкретную программу

### Служебные

- `GET /api/health` - Проверка работоспособности API
- `GET /pay` - Страница оплаты

## 🧪 Тестирование

### Тестовые карты YooKassa:

- **Успешная оплата:** `5555 5555 5555 4477`
- **Отклонённая оплата:** `5555 5555 5555 4444`
- **3DS подтверждение:** `5555 5555 5555 4002` (код: любой)

### Проверка API:

```bash
# Health check
curl https://ваш-домен.vercel.app/api/health

# Создание тестового платежа
curl -X POST https://ваш-домен.vercel.app/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test123",
    "nosology": "paresis",
    "payment_method": "bank_card"
  }'
```

## 📱 Интеграция с iOS приложением

### URL для открытия страницы оплаты:

```
https://ваш-домен.vercel.app/pay?nosology=paresis&user_id=USER_ID
```

### Параметры:

- `nosology` - ID программы (paresis, nodules, hypertonic, hypotonic, dysphagia, mutation, professional, breathing, voiceSetting)
- `user_id` - Уникальный ID пользователя из приложения

### URL Scheme для возврата в приложение:

```
tonebalance://payment/success?nosology=paresis&user_id=USER_ID
```

## 🔐 Безопасность

- ✅ Все платежи проходят через защищенный API YooKassa
- ✅ Secret Key хранится в переменных окружения (не в коде)
- ✅ HTTPS обязателен для работы с YooKassa
- ✅ Webhook подписи проверяются автоматически
- ✅ Чувствительные данные не логируются

## 📊 Мониторинг

### Vercel:

- Логи: https://vercel.com/dashboard → ваш проект → Logs
- Аналитика: https://vercel.com/dashboard → ваш проект → Analytics

### YooKassa:

- Платежи: https://yookassa.ru/my/payments
- Webhook логи: https://yookassa.ru/my/integration/http-notifications

## 🐛 Решение проблем

### Ошибка: "Unexpected token '<', "<html>"

**Причина:** Backend не запущен или недоступен

**Решение:**
1. Убедитесь, что проект развернут на Vercel/Railway
2. Проверьте переменные окружения
3. Убедитесь, что `vercel.json` правильно настроен

### Ошибка: "Payment creation failed"

**Причина:** Неправильный Secret Key или Shop ID

**Решение:**
1. Проверьте правильность ключей в YooKassa ЛК
2. Убедитесь, что используете правильный режим (test/live)

Полный список решений проблем см. в [QUICKSTART.md](QUICKSTART.md)

## 📄 Лицензия

MIT License - используйте свободно для коммерческих и некоммерческих проектов.

## 📞 Поддержка

- **YooKassa Support:** support@yookassa.ru
- **Документация YooKassa:** https://yookassa.ru/developers
- **Vercel Docs:** https://vercel.com/docs

## 🎯 Roadmap

- [ ] Добавить поддержку промокодов
- [ ] Реализовать систему возвратов
- [ ] Добавить email-уведомления
- [ ] Интеграция с базой данных (PostgreSQL/MongoDB)
- [ ] Админ-панель для управления подписками
- [ ] Аналитика платежей и конверсии

---

Сделано с ❤️ для ToneBalance
