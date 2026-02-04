# ToneBalance - Руководство по установке и настройке

## 📦 Что было сделано

### ✅ Реализовано

1. **OAuth авторизация**
   - Apple Sign In (полностью рабочий)
   - Google OAuth (требует настройки credentials)
   - VK OAuth (требует настройки credentials)
   - Email авторизация (работает без настройки)

2. **Дизайн и стили**
   - Фиолетовая цветовая схема (violet-600 как primary)
   - Glassmorphism эффекты (backdrop-filter, прозрачность)
   - Анимированные градиенты на главной странице
   - Обновлена иконка приложения (фиолетовый микрофон)
   - PWA поддержка (manifest.json, иконки разных размеров)

3. **Исправления**
   - Исправлены все TypeScript ошибки
   - Обновлена система генерации кодов доступа
   - Улучшена безопасность (разные ключи для разных планов)

## 🚀 Быстрый старт

### 1. Распаковка архива

```bash
unzip tonebalance-updated.zip
cd tonebalance
```

### 2. Установка зависимостей

```bash
pnpm install
```

### 3. Настройка переменных окружения

Файл `.env` уже создан с шаблоном. Необходимо заполнить следующие поля:

```env
# Database (обязательно)
DATABASE_URL=mysql://user:password@host:3306/database

# JWT Secret (обязательно)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Base URL (обязательно)
BASE_URL=https://yourdomain.com

# YooKassa (обязательно для платежей)
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key
```

### 4. Настройка базы данных

```bash
pnpm db:push
```

### 5. Запуск

**Development:**
```bash
pnpm dev
```

**Production:**
```bash
pnpm build
pnpm start
```

## 🔐 Настройка OAuth провайдеров

### Apple Sign In (уже работает)

Apple Sign In уже настроен и работает с базовым Client ID. Для production необходимо:

1. Зарегистрировать Service ID в [Apple Developer Console](https://developer.apple.com/account/)
2. Настроить Web Authentication Configuration
3. Обновить переменные в `.env`:
   ```env
   VITE_APPLE_CLIENT_ID=your.service.id
   APPLE_TEAM_ID=XXXXXXXXXX
   APPLE_KEY_ID=XXXXXXXXXX
   APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

### Google OAuth (требует настройки)

1. Перейти в [Google Cloud Console](https://console.cloud.google.com/)
2. Создать новый проект
3. Включить Google+ API
4. Создать OAuth 2.0 Client ID:
   - Type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/google/callback`
5. Скопировать Client ID и Client Secret
6. Обновить `.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### VK OAuth (требует настройки)

1. Перейти в [VK Developers](https://dev.vk.com/)
2. Создать новое приложение (тип: Веб-сайт)
3. В настройках указать:
   - Authorized redirect URI: `https://yourdomain.com/api/auth/vk/callback`
4. Скопировать App ID и Secure key
5. Обновить `.env`:
   ```env
   VITE_VK_APP_ID=12345678
   VK_APP_SECRET=your-secure-key
   ```

## 🎨 Дизайн система

### Цветовая схема

Приложение использует фиолетовую палитру:
- **Primary**: `violet-600` (#8b5cf6)
- **Градиенты**: 
  - Основной: `#667eea` → `#764ba2`
  - Светлый: `#a78bfa` → `#c084fc`
  - Анимированный: `#667eea`, `#764ba2`, `#f093fb`, `#4facfe`

### Glassmorphism эффекты

Добавлены следующие CSS классы:

```css
.glass {
  /* Базовый glass эффект */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-card {
  /* Glass карточка с тенью */
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(139, 92, 246, 0.1);
}

.bg-animated-gradient {
  /* Анимированный градиент (15s цикл) */
  background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}
```

### Использование в компонентах

**Header с glass эффектом:**
```tsx
<header className="border-b glass sticky top-0 z-50">
  {/* content */}
</header>
```

**Hero секция с glass карточкой:**
```tsx
<div className="glass-card rounded-3xl p-8 md:p-12">
  {/* content */}
</div>
```

**Фон с анимированным градиентом:**
```tsx
<div className="min-h-screen bg-animated-gradient">
  {/* content */}
</div>
```

## 📱 PWA (Progressive Web App)

Приложение поддерживает установку как PWA:
- Добавлен `manifest.json` с метаданными
- Созданы иконки: `favicon.ico`, `icon-192.png`, `icon-512.png`
- Theme color: `#8b5cf6` (фиолетовый)

## 🧪 Тестирование

Запуск тестов:
```bash
pnpm test
```

**Статус тестов:**
- ✅ 8 из 9 тестов проходят успешно
- ⚠️ 1 тест платежей требует настройки YooKassa credentials

## 📂 Структура проекта

```
tonebalance/
├── client/                    # Frontend
│   ├── public/               # Статика (иконки, manifest)
│   │   ├── favicon.ico
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   │   ├── AppleSignInButton.tsx
│   │   │   ├── GoogleSignInButton.tsx  # ✨ Новый
│   │   │   ├── VKSignInButton.tsx      # ✨ Новый
│   │   │   └── ui/           # UI компоненты
│   │   ├── pages/            # Страницы
│   │   │   ├── Home.tsx      # ✨ Обновлен (glass эффекты)
│   │   │   ├── Login.tsx     # ✨ Обновлен (все OAuth)
│   │   │   ├── Dashboard.tsx # ✨ Обновлен (glass эффекты)
│   │   │   └── ...
│   │   ├── index.css         # ✨ Обновлен (фиолетовые тона + glass)
│   │   └── const.ts          # ✨ Обновлен (Google, VK URLs)
│   └── index.html            # ✨ Обновлен (иконки, manifest)
├── server/                   # Backend
│   ├── _core/
│   │   ├── oauth.ts          # ✨ Обновлен (Google, VK callbacks)
│   │   └── ...
│   ├── utils/
│   │   └── accessCode.ts     # ✨ Исправлен (TypeScript)
│   ├── routers.ts            # ✨ Исправлен (типы)
│   └── ...
├── .env                      # ✨ Создан (шаблон)
├── README.md                 # ✨ Создан
├── CHANGELOG.md              # ✨ Создан
└── package.json
```

## 🔧 Команды

```bash
pnpm dev          # Запуск dev сервера (http://localhost:5000)
pnpm build        # Сборка для production
pnpm start        # Запуск production сервера
pnpm test         # Запуск тестов
pnpm check        # TypeScript проверка типов
pnpm format       # Форматирование кода (Prettier)
pnpm db:push      # Применить миграции БД
```

## ⚠️ Важные замечания

### Для работы OAuth необходимо:

1. **Настроить redirect URIs** у каждого провайдера:
   - Apple: `https://yourdomain.com/api/auth/apple/callback`
   - Google: `https://yourdomain.com/api/auth/google/callback`
   - VK: `https://yourdomain.com/api/auth/vk/callback`

2. **Обновить BASE_URL** в `.env` на ваш домен

3. **Получить credentials** для каждого провайдера

### Email авторизация работает без настройки

Email авторизация работает сразу после установки, не требует дополнительных настроек.

## 📞 Поддержка

Если возникли вопросы:
1. Проверьте `README.md` в корне проекта
2. Изучите `CHANGELOG.md` для списка изменений
3. Проверьте логи сервера при ошибках OAuth

## 🎉 Готово!

После настройки всех переменных окружения приложение готово к использованию. Все OAuth провайдеры будут работать корректно после получения credentials.
