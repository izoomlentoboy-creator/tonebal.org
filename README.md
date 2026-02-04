# ToneBalance - Голосовая реабилитация онлайн

Профессиональные программы восстановления голоса, разработанные логопедами.

## Особенности

- ✅ **OAuth авторизация**: Apple ID, Google, VK, Email
- ✅ **Современный дизайн**: Фиолетовые тона с эффектом стекла (glassmorphism)
- ✅ **10 программ реабилитации**: От дыхательной гимнастики до профессионального вокала
- ✅ **Система подписок**: Интеграция с YooKassa
- ✅ **Отслеживание прогресса**: Личный кабинет с аналитикой
- ✅ **Адаптивный дизайн**: Работает на всех устройствах

## Технологии

### Frontend
- React 19 + TypeScript
- Vite
- TailwindCSS 4 (с кастомными glass эффектами)
- tRPC для type-safe API
- Wouter для роутинга
- Radix UI компоненты

### Backend
- Express.js
- MySQL/TiDB (через Drizzle ORM)
- JWT авторизация
- YooKassa платежи

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/izoomlentoboy-creator/tonebal.org.git
cd tonebal.org
```

2. Установите зависимости:
```bash
pnpm install
```

3. Настройте переменные окружения в `.env`:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/tonebalance

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Base URL
BASE_URL=http://localhost:5000

# YooKassa
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key

# Apple Sign In
VITE_APPLE_CLIENT_ID=org.tonebal.web
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=your-private-key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# VK OAuth
VITE_VK_APP_ID=your-vk-app-id
VK_APP_SECRET=your-vk-app-secret
```

4. Примените миграции базы данных:
```bash
pnpm db:push
```

5. Запустите dev сервер:
```bash
pnpm dev
```

Приложение будет доступно по адресу `http://localhost:5000`

## Настройка OAuth провайдеров

### Apple Sign In

1. Перейдите в [Apple Developer Console](https://developer.apple.com/account/)
2. Создайте новый Service ID
3. Настройте Web Authentication Configuration:
   - Return URLs: `https://yourdomain.com/api/auth/apple/callback`
4. Скопируйте Client ID, Team ID, Key ID и Private Key в `.env`

### Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/google/callback`
5. Скопируйте Client ID и Client Secret в `.env`

### VK OAuth

1. Перейдите в [VK Developers](https://dev.vk.com/)
2. Создайте новое приложение (тип: Веб-сайт)
3. В настройках приложения:
   - Authorized redirect URI: `https://yourdomain.com/api/auth/vk/callback`
4. Скопируйте App ID и Secure key в `.env`

## Структура проекта

```
tonebalance/
├── client/              # Frontend React приложение
│   ├── public/          # Статические файлы (иконки, manifest)
│   └── src/
│       ├── components/  # React компоненты
│       ├── pages/       # Страницы приложения
│       ├── lib/         # Утилиты и конфигурация
│       └── index.css    # Стили (TailwindCSS + glass effects)
├── server/              # Backend Express сервер
│   ├── _core/           # Ядро системы (OAuth, tRPC, SDK)
│   ├── services/        # Сервисы (YooKassa)
│   ├── utils/           # Утилиты
│   ├── db.ts            # Database queries
│   └── routers.ts       # tRPC роутеры
├── shared/              # Общий код (типы, константы)
├── drizzle/             # Миграции базы данных
└── .env                 # Переменные окружения
```

## Команды

```bash
pnpm dev          # Запуск dev сервера
pnpm build        # Сборка для production
pnpm start        # Запуск production сервера
pnpm test         # Запуск тестов
pnpm db:push      # Применить миграции БД
pnpm check        # TypeScript проверка типов
pnpm format       # Форматирование кода
```

## Дизайн-система

### Цветовая палитра
- **Primary**: Фиолетовый (violet-600)
- **Градиенты**: От #667eea до #764ba2
- **Эффекты**: Glassmorphism с backdrop-filter

### Кастомные CSS классы
- `.glass` - Базовый glass эффект
- `.glass-card` - Glass карточка с тенью
- `.bg-purple-gradient` - Фиолетовый градиент
- `.bg-animated-gradient` - Анимированный градиент

## Лицензия

MIT

## Контакты

- Website: [tonebal.org](https://tonebal.org)
- Email: support@tonebal.org
