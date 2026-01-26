# 🔄 Обновление проекта через GitHub

## 📋 Обзор

Эта инструкция покажет, как обновить ваш проект на GitHub с новыми файлами, которые включают правильную реализацию webhook'ов YooKassa.

## 📦 Что было обновлено

### Файлы с изменениями:

1. **server.js** - добавлена правильная обработка webhook по требованиям YooKassa:
   - Проверка типа уведомления
   - Верификация через API
   - Проверка IP-адресов (опционально)
   - Обработка всех событий (payment.succeeded, payment.canceled, refund.succeeded)
   - Всегда возвращает HTTP 200

2. **index.html** - обновлена конфигурация API_BASE:
   - Автоматическое определение домена
   - Поддержка как Vercel, так и tonebal.org

### Новые файлы:

3. **WEBHOOK_SETUP.md** - подробная инструкция по настройке webhook
4. **DOMAIN_SETUP.md** - инструкция по настройке домена tonebal.org
5. **GITHUB_UPDATE.md** - эта инструкция

## 🚀 Вариант 1: Обновление через Git (рекомендуется)

### Шаг 1: Клонируйте репозиторий (если еще не сделали)

```bash
# Замените на ваш URL репозитория
git clone https://github.com/ваш-username/tonebal-org.git
cd tonebal-org
```

### Шаг 2: Скопируйте обновленные файлы

Скопируйте файлы из папки `updated/` в корень вашего проекта:

```bash
# Замените пути на актуальные
cp /путь/к/updated/server.js ./server.js
cp /путь/к/updated/index.html ./index.html
cp /путь/к/updated/WEBHOOK_SETUP.md ./WEBHOOK_SETUP.md
cp /путь/к/updated/DOMAIN_SETUP.md ./DOMAIN_SETUP.md
cp /путь/к/updated/GITHUB_UPDATE.md ./GITHUB_UPDATE.md
```

### Шаг 3: Проверьте изменения

```bash
git status
```

Вы должны увидеть:
```
modified:   server.js
modified:   index.html
new file:   WEBHOOK_SETUP.md
new file:   DOMAIN_SETUP.md
new file:   GITHUB_UPDATE.md
```

### Шаг 4: Закоммитьте изменения

```bash
git add .
git commit -m "Update webhook implementation according to YooKassa requirements"
```

### Шаг 5: Отправьте на GitHub

```bash
git push origin main
```

### Шаг 6: Vercel автоматически пересоберет проект

Vercel автоматически обнаружит изменения в GitHub и запустит новый деплой.

**Проверка:**
1. Откройте https://vercel.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Deployments**
4. Вы должны увидеть новый деплой со статусом "Building" или "Ready"

## 🌐 Вариант 2: Обновление через GitHub Web Interface

Если вы не хотите использовать Git в командной строке:

### Шаг 1: Откройте репозиторий на GitHub

Перейдите на https://github.com/ваш-username/tonebal-org

### Шаг 2: Обновите server.js

1. Нажмите на файл `server.js`
2. Нажмите на иконку карандаша ✏️ (Edit this file)
3. Удалите все содержимое
4. Скопируйте содержимое из нового файла `updated/server.js`
5. Вставьте в редактор
6. Внизу страницы нажмите **"Commit changes"**
7. Добавьте описание: "Update webhook implementation"
8. Нажмите **"Commit changes"**

### Шаг 3: Обновите index.html

Повторите процесс для `index.html`:
1. Откройте файл
2. Нажмите ✏️
3. Замените содержимое
4. Commit changes

### Шаг 4: Добавьте новые файлы

Для каждого нового файла (WEBHOOK_SETUP.md, DOMAIN_SETUP.md, GITHUB_UPDATE.md):

1. На главной странице репозитория нажмите **"Add file"** → **"Create new file"**
2. Введите имя файла (например, `WEBHOOK_SETUP.md`)
3. Скопируйте содержимое из соответствующего файла
4. Вставьте в редактор
5. Нажмите **"Commit new file"**

### Шаг 5: Проверьте деплой в Vercel

Vercel автоматически запустит новый деплой после каждого коммита.

## 📱 Вариант 3: Использование GitHub Desktop

Если вы предпочитаете графический интерфейс:

### Шаг 1: Установите GitHub Desktop

Скачайте с https://desktop.github.com

### Шаг 2: Клонируйте репозиторий

1. File → Clone repository
2. Выберите ваш репозиторий
3. Выберите папку для клонирования
4. Нажмите "Clone"

### Шаг 3: Замените файлы

Откройте папку репозитория в проводнике и замените файлы:
- `server.js`
- `index.html`

Добавьте новые файлы:
- `WEBHOOK_SETUP.md`
- `DOMAIN_SETUP.md`
- `GITHUB_UPDATE.md`

### Шаг 4: Commit и Push

1. GitHub Desktop автоматически обнаружит изменения
2. Введите описание коммита: "Update webhook implementation"
3. Нажмите **"Commit to main"**
4. Нажмите **"Push origin"**

## ✅ Проверка успешного обновления

### 1. Проверьте GitHub

Откройте репозиторий на GitHub и убедитесь, что файлы обновлены:
- Дата последнего коммита должна быть сегодняшней
- Файлы должны содержать новый код

### 2. Проверьте Vercel Deployment

1. Откройте https://vercel.com/dashboard
2. Выберите проект
3. Deployments → последний деплой
4. Статус должен быть "Ready"
5. Нажмите на деплой → View Deployment

### 3. Проверьте API

```bash
curl https://tonebal-org.vercel.app/api/health
# или
curl https://tonebal.org/api/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "timestamp": "2026-01-26T...",
  "baseUrl": "https://tonebal.org",
  "shopId": "513198"
}
```

### 4. Проверьте логи

1. Vercel → ваш проект → Logs
2. Должны появиться новые записи:
   ```
   ToneBalance Payment Server Started
   Webhook URL: https://tonebal.org/api/webhooks/yookassa
   ```

## 🔄 Откат изменений (если что-то пошло не так)

### Через Git:

```bash
# Посмотреть историю коммитов
git log

# Откатиться на предыдущий коммит
git revert HEAD

# Или откатиться на конкретный коммит
git revert <commit-hash>

# Отправить на GitHub
git push origin main
```

### Через GitHub Web:

1. Откройте репозиторий
2. Нажмите на файл
3. Нажмите "History"
4. Найдите предыдущую версию
5. Нажмите на commit
6. Нажмите "..." → "Revert this commit"

### Через Vercel:

1. Deployments → найдите предыдущий рабочий деплой
2. Нажмите "..." → "Promote to Production"

## 📝 Структура проекта после обновления

```
tonebal-org/
├── .gitignore
├── .env.example
├── DEPLOY.md
├── WEBHOOK_SETUP.md          ← НОВЫЙ
├── DOMAIN_SETUP.md            ← НОВЫЙ
├── GITHUB_UPDATE.md           ← НОВЫЙ
├── README.md
├── index.html                 ← ОБНОВЛЕН
├── server.js                  ← ОБНОВЛЕН
├── package.json
├── vercel.json
└── railway.json
```

## 🐛 Решение проблем

### Проблема 1: "Permission denied" при git push

**Решение:**
```bash
# Настройте SSH ключ или используйте HTTPS с токеном
git remote set-url origin https://github.com/username/repo.git
```

### Проблема 2: Конфликт при git push

**Решение:**
```bash
# Получите последние изменения
git pull origin main

# Разрешите конфликты вручную
# Затем
git add .
git commit -m "Resolve conflicts"
git push origin main
```

### Проблема 3: Vercel не запускает деплой

**Причины:**
- Отключена автоматическая интеграция с GitHub

**Решение:**
1. Vercel → Settings → Git
2. Убедитесь, что "Auto Deploy" включен
3. Или запустите деплой вручную: Deployments → Redeploy

### Проблема 4: Ошибки в новом коде

**Решение:**
1. Проверьте логи Vercel
2. Убедитесь, что все файлы скопированы полностью
3. Проверьте, что переменные окружения установлены
4. При необходимости откатитесь на предыдущую версию

## 📞 Поддержка

**GitHub:**
- Документация: https://docs.github.com
- Help: https://github.com/support

**Vercel:**
- Документация: https://vercel.com/docs
- Support: https://vercel.com/support

**Git:**
- Официальная документация: https://git-scm.com/doc
- Интерактивный туториал: https://learngitbranching.js.org

## 🎯 Следующие шаги

После успешного обновления:

1. ✅ Настройте webhook в YooKassa (см. WEBHOOK_SETUP.md)
2. ✅ Настройте домен tonebal.org (см. DOMAIN_SETUP.md)
3. ✅ Выполните тестовый платеж
4. ✅ Проверьте, что webhook получен и обработан
5. ✅ Проверьте активацию подписки

---

Готово! Ваш проект обновлен с правильной реализацией webhook'ов YooKassa! 🚀
