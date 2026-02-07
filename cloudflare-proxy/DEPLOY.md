# Деплой Cloudflare Worker (обратный прокси)

Этот Worker решает проблему блокировки Vercel в России.
Весь трафик проходит через сеть Cloudflare, которая доступна из России.

## Принцип работы

```
Пользователь (Россия) → Cloudflare Edge → Worker → Vercel Origin
```

Пользователь общается только с Cloudflare. Worker получает контент от Vercel
и отдаёт его пользователю.

## Шаги деплоя

### 1. Установите зависимости

```bash
cd cloudflare-proxy
npm install
```

### 2. Авторизуйтесь в Cloudflare

```bash
npx wrangler login
```

### 3. Настройте origin URL

В файле `wrangler.toml` укажите ваш Vercel deployment URL:

```toml
[vars]
VERCEL_ORIGIN = "https://tonebal-org.vercel.app"
```

Чтобы узнать ваш Vercel URL:
- Откройте проект в Vercel Dashboard
- Скопируйте URL вида `https://project-name.vercel.app`

### 4. Деплой Worker

```bash
npx wrangler deploy
```

### 5. Привяжите домен

В Cloudflare Dashboard:

1. Перейдите в **Workers & Pages** → **tonebal-proxy**
2. **Settings** → **Domains & Routes**
3. Нажмите **Add** → **Custom Domain**
4. Добавьте `tonebal.org`
5. Повторите для `www.tonebal.org` (если нужно)

### 6. Настройте DNS (если ещё не сделано)

В Cloudflare DNS убедитесь:
- A-запись `tonebal.org` → любой IP (Worker перехватит) → Proxied (оранжевое облако)
- CNAME `www` → `tonebal.org` → Proxied (оранжевое облако)

## Проверка

После деплоя проверьте доступность из России:
- https://isitdown.ru/tonebal.org
- Используйте VPN с российским сервером

## Важно

- Worker бесплатен на тарифе Cloudflare Free (100,000 запросов/день)
- Если нужно больше — Workers Paid plan ($5/мес, 10 млн запросов/мес)
- Vercel deployment продолжает работать как origin-сервер
- Все API запросы (/api/*) тоже проксируются
