# 🌐 Настройка домена tonebal.org для Vercel

## 📋 Обзор

Сейчас ваш проект доступен по адресу Vercel:
```
https://tonebal-org.vercel.app
```

Чтобы использовать ваш собственный домен `tonebal.org`, нужно:
1. Добавить домен в настройках Vercel
2. Настроить DNS-записи у вашего регистратора домена
3. Дождаться активации SSL-сертификата

## 🚀 Пошаговая инструкция

### Шаг 1: Добавление домена в Vercel

1. **Откройте проект в Vercel:**
   - Перейдите на https://vercel.com/dashboard
   - Выберите ваш проект `tonebal-org`

2. **Перейдите в настройки домена:**
   - Нажмите на вкладку **"Settings"** (в верхнем меню)
   - В левом меню выберите **"Domains"**

3. **Добавьте домен:**
   - В поле **"Add Domain"** введите: `tonebal.org`
   - Нажмите **"Add"**

4. **Добавьте www-версию (опционально):**
   - Повторите процесс для `www.tonebal.org`
   - Vercel автоматически настроит редирект с www на основной домен

### Шаг 2: Настройка DNS-записей

Vercel покажет вам инструкции по настройке DNS. Есть два варианта:

#### Вариант A: Использование Vercel Nameservers (рекомендуется)

**Преимущества:**
- Автоматическая настройка
- Быстрое обновление
- Встроенная защита от DDoS

**Инструкция:**
1. Vercel предоставит вам nameservers, например:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

2. Перейдите к вашему регистратору домена (где вы купили tonebal.org)
3. Найдите раздел **"Nameservers"** или **"DNS Management"**
4. Замените текущие nameservers на nameservers от Vercel
5. Сохраните изменения

**Популярные регистраторы:**

- **REG.RU:**
  1. Войдите в личный кабинет
  2. Выберите домен → DNS-серверы и зона
  3. Выберите "Использовать другие DNS-серверы"
  4. Введите nameservers от Vercel
  5. Сохраните

- **Cloudflare:**
  1. Войдите в Cloudflare
  2. Выберите домен
  3. DNS → Nameservers
  4. Change nameservers
  5. Введите nameservers от Vercel

- **GoDaddy:**
  1. My Products → Domains
  2. Выберите домен → Manage DNS
  3. Nameservers → Change
  4. Custom → Enter my own nameservers
  5. Введите nameservers от Vercel

#### Вариант B: Настройка A-записи (если не хотите менять nameservers)

**Инструкция:**
1. Vercel покажет IP-адрес, например: `76.76.21.21`
2. Перейдите к вашему регистратору домена
3. Найдите раздел **"DNS Records"** или **"Управление DNS"**
4. Добавьте A-запись:
   - **Type:** A
   - **Name:** @ (или оставьте пустым)
   - **Value:** IP-адрес от Vercel
   - **TTL:** 3600 (или Auto)

5. Для www-версии добавьте CNAME:
   - **Type:** CNAME
   - **Name:** www
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 3600

### Шаг 3: Проверка настройки

1. **В Vercel:**
   - Вернитесь в Settings → Domains
   - Статус домена должен измениться на "Valid Configuration"
   - Это может занять от нескольких минут до 48 часов

2. **Проверка DNS:**
   ```bash
   # Проверка A-записи
   nslookup tonebal.org
   
   # Или
   dig tonebal.org
   ```

3. **Проверка доступности:**
   ```bash
   curl https://tonebal.org/api/health
   ```

### Шаг 4: Обновление переменных окружения

После того как домен заработает:

1. **Обновите BASE_URL в Vercel:**
   - Settings → Environment Variables
   - Найдите `BASE_URL`
   - Измените значение на: `https://tonebal.org`
   - Сохраните

2. **Пересоберите проект:**
   - Deployments → последний деплой → три точки ⋮ → Redeploy

### Шаг 5: Обновление webhook в YooKassa

1. Откройте https://yookassa.ru/my
2. **Интеграция** → **HTTP-уведомления**
3. Измените URL на: `https://tonebal.org/api/webhooks/yookassa`
4. Сохраните изменения

## 🔍 Проверка SSL-сертификата

Vercel автоматически выпускает SSL-сертификат для вашего домена.

**Проверка:**
1. Откройте https://tonebal.org в браузере
2. Нажмите на замок 🔒 в адресной строке
3. Проверьте сертификат - должен быть выпущен Let's Encrypt

**Если сертификат не выпущен:**
- Подождите 10-15 минут
- Проверьте правильность DNS-записей
- Убедитесь, что домен доступен по HTTP (Vercel сначала проверяет HTTP, затем выпускает HTTPS)

## ⚙️ Дополнительные настройки

### Редирект с www на основной домен

Vercel автоматически настроит редирект, если вы добавили оба домена:
- `www.tonebal.org` → `tonebal.org`

### Редирект с HTTP на HTTPS

Vercel автоматически перенаправляет все HTTP-запросы на HTTPS.

### Custom 404 страница

Создайте файл `404.html` в корне проекта для кастомной страницы ошибки.

## 🐛 Решение проблем

### Проблема 1: "Invalid Configuration" в Vercel

**Причины:**
- DNS-записи еще не обновились
- Неправильные DNS-записи

**Решение:**
1. Проверьте DNS через `nslookup tonebal.org`
2. Подождите до 48 часов (обычно 1-2 часа)
3. Убедитесь, что A-запись указывает на правильный IP

### Проблема 2: Домен не открывается

**Причины:**
- DNS еще не распространился
- Неправильная конфигурация

**Решение:**
1. Проверьте DNS: `dig tonebal.org`
2. Очистите кеш DNS:
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Windows
   ipconfig /flushdns
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```
3. Попробуйте открыть в режиме инкогнито

### Проблема 3: SSL-сертификат не выпускается

**Причины:**
- Домен недоступен по HTTP
- CAA-записи блокируют Let's Encrypt

**Решение:**
1. Проверьте доступность: `curl http://tonebal.org`
2. Проверьте CAA-записи: `dig CAA tonebal.org`
3. Если есть CAA-записи, добавьте: `0 issue "letsencrypt.org"`

### Проблема 4: "Too Many Redirects"

**Причины:**
- Конфликт настроек SSL в Cloudflare
- Неправильная конфигурация

**Решение:**
1. Если используете Cloudflare: SSL/TLS → Full (strict)
2. Отключите "Always Use HTTPS" в Cloudflare
3. Vercel сам управляет HTTPS

## 📊 Проверка распространения DNS

Используйте онлайн-инструменты:

1. **DNS Checker:**
   - https://dnschecker.org
   - Введите `tonebal.org`
   - Проверьте A-запись

2. **What's My DNS:**
   - https://www.whatsmydns.net
   - Введите `tonebal.org`
   - Выберите тип записи: A

3. **DNS Propagation Checker:**
   - https://www.dnswatch.info

## 📝 Чеклист настройки домена

- [ ] Домен добавлен в Vercel (tonebal.org)
- [ ] www-версия добавлена (www.tonebal.org)
- [ ] DNS-записи настроены у регистратора
- [ ] Статус в Vercel: "Valid Configuration"
- [ ] Домен открывается в браузере
- [ ] SSL-сертификат выпущен и работает
- [ ] BASE_URL обновлен в переменных окружения
- [ ] Проект пересобран (Redeploy)
- [ ] Webhook URL обновлен в YooKassa
- [ ] Тестовый платеж выполнен успешно

## 🎯 Итоговая конфигурация

### DNS-записи (если используете A-запись):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | IP от Vercel | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |

### Vercel Domains:

- ✅ `tonebal.org` (Primary)
- ✅ `www.tonebal.org` (Redirect to primary)

### Environment Variables:

| Key | Value |
|-----|-------|
| `BASE_URL` | `https://tonebal.org` |
| `YOOKASSA_SHOP_ID` | `513198` |
| `YOOKASSA_SECRET_KEY` | ваш ключ |

## 📞 Поддержка

**Vercel:**
- Документация: https://vercel.com/docs/concepts/projects/domains
- Support: https://vercel.com/support

**Регистратор домена:**
- Обратитесь в поддержку вашего регистратора для помощи с DNS

---

После выполнения всех шагов ваш проект будет доступен по адресу https://tonebal.org! 🎉
