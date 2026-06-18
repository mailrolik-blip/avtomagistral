# Автомагистраль 1.0

Standalone Next.js-проект лендинга ООО «Автомагистраль» с серверным API заявок.

## Локальный запуск

```bash
npm install
npm run dev
```

Проект запускается на `http://localhost:3002`.

## Env

Создайте `.env` по примеру `.env.example`.

```env
AVTOMAGISTRAL_LEADS_WEBHOOK_URL=
AVTOMAGISTRAL_LEADS_TO=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Основной способ доставки заявок - `AVTOMAGISTRAL_LEADS_WEBHOOK_URL` для Google Apps Script webhook. SMTP используется только как fallback, если webhook не задан и SMTP-переменные заполнены.

## Структура

- `app/page.tsx` - главная страница лендинга.
- `app/api/leads/route.ts` - API приема заявок.
- `components/` - UI лендинга.
- `lib/mail/` - SMTP fallback.
- `public/` - изображения и брендовые ассеты.

Проект не использует Prisma, auth Gorilla, кабинет, админку, игру, hockey components или данные Gorilla.

## Production Deploy

Целевой путь на сервере:

```bash
/var/www/avtomagistral
```

Порт:

```bash
3002
```

### Установка

```bash
cd /var/www/avtomagistral
npm ci
npm run build
```

### Systemd

Сервис: `avtomagistral.service`.

Пример `/etc/systemd/system/avtomagistral.service`:

```ini
[Unit]
Description=Avtomagistral Next.js app
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/avtomagistral
Environment=NODE_ENV=production
EnvironmentFile=/var/www/avtomagistral/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable avtomagistral.service
sudo systemctl restart avtomagistral.service
sudo systemctl status avtomagistral.service
```

### Nginx

Домены:

- `avtomagistral77.ru`
- `www.avtomagistral77.ru`
- `xn--77-6kcaaki4b2afv2amig7n.xn--p1ai`
- `www.xn--77-6kcaaki4b2afv2amig7n.xn--p1ai`

Пример server block:

```nginx
server {
    listen 80;
    server_name avtomagistral77.ru www.avtomagistral77.ru xn--77-6kcaaki4b2afv2amig7n.xn--p1ai www.xn--77-6kcaaki4b2afv2amig7n.xn--p1ai;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После настройки DNS выпустить SSL через certbot:

```bash
sudo certbot --nginx -d avtomagistral77.ru -d www.avtomagistral77.ru -d xn--77-6kcaaki4b2afv2amig7n.xn--p1ai -d www.xn--77-6kcaaki4b2afv2amig7n.xn--p1ai
```

## Проверки после деплоя

1. Главная страница открывается на основном домене.
2. Алиас `.рф` открывается через punycode-домен.
3. Все секции лендинга отображаются.
4. Форма заказа техники отправляется.
5. Форма сотрудничества отправляется.
6. Форма обратного звонка отправляется.
7. При ошибке webhook пользователь видит понятную ошибку.
8. Webhook получает payload без раскрытия секретов клиенту.
9. Логи сервиса не содержат критичных ошибок:

```bash
journalctl -u avtomagistral.service -f
```

## Развитие

Текущая структура оставляет место для следующих модулей без переписывания ядра проекта: админка заявок, CRM, карточки техники, SEO-страницы услуг, города и направления, интеграции и личный кабинет.
