# ToneBalance Web Payment - Инструкция по развёртыванию

## 📁 Структура файлов

```
WebPayment/
├── index.html      # Страница оплаты (загрузить на tonebal.org/pay)
├── server.js       # Node.js сервер (для хостинга с Node.js)
├── package.json    # Зависимости
└── DEPLOY.md       # Эта инструкция
```

## 🚀 Варианты развёртывания

### Вариант 1: Простой (только HTML на любом хостинге)

Если у вас обычный хостинг без Node.js, нужно создать отдельный backend-сервер.

1. **Загрузите `index.html`** на ваш хостинг как `tonebal.org/pay/index.html`
2. **Настройте редирект** в `.htaccess`:
```apache
RewriteEngine On
RewriteRule ^pay$ /pay/index.html [L]
```

3. **Backend нужно разместить отдельно** (см. Вариант 2 или 3)

---

### Вариант 2: Vercel (Бесплатно, рекомендуется)

1. **Установите Vercel CLI:**
```bash
npm install -g vercel
```

2. **Создайте `vercel.json` в папке WebPayment:**
```json
{
  "rewrites": [
    { "source": "/pay", "destination": "/index.html" },
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

3. **Задеплойте:**
```bash
cd WebPayment
vercel
```

4. **Настройте домен** в Vercel Dashboard → Settings → Domains → добавьте `tonebal.org`

5. **Установите переменные окружения** в Vercel Dashboard:
   - `YOOKASSA_SHOP_ID` = `513198`
   - `YOOKASSA_SECRET_KEY` = ваш секретный ключ из ЛК YooKassa
   - `BASE_URL` = `https://tonebal.org`

---

### Вариант 3: Railway (Просто, ~$5/мес)

1. **Зарегистрируйтесь** на [railway.app](https://railway.app)

2. **Создайте новый проект** → Deploy from GitHub или Upload

3. **Добавьте переменные окружения:**
   - `YOOKASSA_SHOP_ID` = `513198`
   - `YOOKASSA_SECRET_KEY` = ваш секретный ключ
   - `BASE_URL` = `https://tonebal.org`
   - `PORT` = `3000`

4. **Настройте домен** в Settings → Domains

---

### Вариант 4: VPS (Timeweb, Selectel, ~300₽/мес)

1. **Подключитесь к серверу:**
```bash
ssh root@your-server-ip
```

2. **Установите Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Создайте папку и загрузите файлы:**
```bash
mkdir -p /var/www/tonebalance
# Загрузите файлы через SCP или FTP
```

4. **Установите зависимости:**
```bash
cd /var/www/tonebalance
npm install
```

5. **Создайте `.env` файл:**
```bash
nano .env
```
Содержимое:
```
YOOKASSA_SHOP_ID=513198
YOOKASSA_SECRET_KEY=ваш_секретный_ключ
BASE_URL=https://tonebal.org
PORT=3000
```

6. **Установите PM2 для автозапуска:**
```bash
npm install -g pm2
pm2 start server.js --name tonebalance
pm2 save
pm2 startup
```

7. **Настройте Nginx:**
```bash
sudo nano /etc/nginx/sites-available/tonebalance
```

Конфигурация:
```nginx
server {
    listen 80;
    server_name tonebal.org www.tonebal.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Включите сайт и SSL:**
```bash
sudo ln -s /etc/nginx/sites-available/tonebalance /etc/nginx/sites-enabled/
sudo certbot --nginx -d tonebal.org -d www.tonebal.org
sudo systemctl restart nginx
```

---

## 🔑 Настройка YooKassa

### 1. Получите Secret Key

1. Войдите в [ЛК ЮKassa](https://yookassa.ru/my)
2. Перейдите в **Интеграция** → **Ключи API**
3. Скопируйте **Секретный ключ** (начинается с `live_` или `test_`)

### 2. Настройте Webhook

1. В ЛК ЮKassa → **Интеграция** → **HTTP-уведомления**
2. Добавьте URL: `https://tonebal.org/api/webhooks/yookassa`
3. Выберите события:
   - `payment.succeeded`
   - `payment.canceled`
   - `refund.succeeded`

### 3. Тестовый режим

Для тестирования используйте тестовый ключ (начинается с `test_`).

---

## 📱 Настройка iOS приложения

После деплоя backend'а приложение автоматически будет:

1. Открывать `https://tonebal.org/pay?nosology=XXX&user_id=XXX` в Safari
2. После оплаты возвращать пользователя в приложение
3. Проверять статус подписки через API

### URL Scheme

Убедитесь, что в `Info.plist` настроен URL scheme:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>tonebalance</string>
        </array>
    </dict>
</array>
```

---

## 🧪 Тестирование

### 1. Проверьте API:
```bash
curl https://tonebal.org/api/health
# Должен вернуть: {"status":"ok",...}
```

### 2. Откройте страницу оплаты:
```
https://tonebal.org/pay?nosology=paresis&user_id=test123
```

### 3. Тестовые карты YooKassa:
- **Успешная оплата:** `5555 5555 5555 4477` (любая дата, CVC)
- **Отклонённая:** `5555 5555 5555 4444`
- **3DS:** `5555 5555 5555 4002` (код подтверждения: любой)

---

## 🔧 Мониторинг

### Логи на VPS:
```bash
pm2 logs tonebalance
```

### Статус:
```bash
pm2 status
```

### Перезапуск:
```bash
pm2 restart tonebalance
```

---

## ⚠️ Важно

1. **Никогда не храните Secret Key в коде** - используйте переменные окружения
2. **Используйте HTTPS** - YooKassa требует SSL
3. **Сохраняйте логи платежей** - для разбора спорных ситуаций
4. **Регулярно проверяйте** webhook'и в ЛК YooKassa

---

## 📞 Поддержка

- YooKassa: support@yookassa.ru
- Документация: https://yookassa.ru/developers
