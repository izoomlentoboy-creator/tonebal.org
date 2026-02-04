# Changelog

## [Обновление] - 2026-02-04

### ✨ Новые возможности

#### OAuth авторизация
- ✅ **Apple Sign In** - Полноценная авторизация через Apple ID
- ✅ **Google OAuth** - Авторизация через Google аккаунт
- ✅ **VK OAuth** - Авторизация через ВКонтакте
- ✅ **Email авторизация** - Простой вход по email без пароля

#### Дизайн и UI
- 🎨 **Фиолетовая цветовая схема** - Обновлены все цвета на violet-тона
- ✨ **Glassmorphism эффекты** - Добавлены glass-эффекты для карточек и элементов
- 🌈 **Анимированные градиенты** - Красивые фоновые градиенты с анимацией
- 🎯 **Новая иконка** - Обновлена иконка приложения
- 📱 **PWA поддержка** - Добавлен manifest.json для установки как приложение

#### Backend улучшения
- 🔒 **Улучшенная безопасность** - Обновлена система генерации кодов доступа
- 🔑 **Разные ключи для планов** - Отдельные ключи для месячной и годовой подписки
- 🐛 **Исправлены ошибки** - Исправлены TypeScript ошибки в коде

### 🎨 Дизайн система

#### Цветовая палитра
- Primary: `violet-600` (#8b5cf6)
- Градиенты: `#667eea` → `#764ba2`
- Theme color: `#8b5cf6`

#### Новые CSS классы
- `.glass` - Базовый glass эффект с backdrop-filter
- `.glass-card` - Glass карточка с тенью и border
- `.bg-purple-gradient` - Статичный фиолетовый градиент
- `.bg-purple-gradient-light` - Светлый фиолетовый градиент
- `.bg-animated-gradient` - Анимированный градиент (15s цикл)

### 🔧 Технические изменения

#### Компоненты
- Добавлен `GoogleSignInButton.tsx` с Google логотипом
- Добавлен `VKSignInButton.tsx` с VK логотипом
- Обновлен `Login.tsx` с поддержкой всех OAuth провайдеров

#### Backend
- Обновлен `server/_core/oauth.ts` с Google и VK callback'ами
- Исправлен `server/utils/accessCode.ts` для совместимости с TypeScript
- Исправлен `server/routers.ts` с правильными типами Zod

#### Конфигурация
- Добавлен `.env` с шаблоном всех переменных окружения
- Обновлен `index.html` с meta-тегами и favicon'ами
- Создан `manifest.json` для PWA

### 📝 Документация
- Создан `README.md` с полной инструкцией по установке
- Добавлены инструкции по настройке OAuth провайдеров
- Описана структура проекта и команды

### 🐛 Исправленные ошибки
- Исправлена ошибка итерации строки в `accessCode.ts`
- Исправлена ошибка типов в `z.record()` в `routers.ts`
- Исправлен вызов `generateAccessCode()` в webhook'е
- Все TypeScript проверки проходят успешно

### 📦 Файлы
- Добавлены иконки: `favicon.ico`, `icon-192.png`, `icon-512.png`
- Добавлен `manifest.json` для PWA
- Обновлен `index.css` с glass эффектами

### ⚠️ Важные замечания

#### Для запуска требуется настроить:
1. **Google OAuth**:
   - Создать проект в Google Cloud Console
   - Получить Client ID и Client Secret
   - Добавить redirect URI: `https://yourdomain.com/api/auth/google/callback`

2. **VK OAuth**:
   - Создать приложение в VK Developers
   - Получить App ID и Secure key
   - Добавить redirect URI: `https://yourdomain.com/api/auth/vk/callback`

3. **Apple Sign In**:
   - Настроить Service ID в Apple Developer Console
   - Получить Team ID, Key ID и Private Key
   - Добавить return URL: `https://yourdomain.com/api/auth/apple/callback`

#### Тесты
- ✅ 8 из 9 тестов проходят успешно
- ⚠️ 1 тест платежей требует настройки YooKassa credentials

### 🚀 Следующие шаги
1. Настроить OAuth credentials для production
2. Обновить BASE_URL в .env для production
3. Настроить YooKassa для реальных платежей
4. Деплой на production сервер
