# Автомагистраль 1.1

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
AVTOMAGISTRAL_LEADS_WEBHOOK_URL=https://example.com/webhook
AVTOMAGISTRAL_LEADS_TO=leads@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=change-me
SMTP_FROM=noreply@example.com
```

Основной способ доставки заявок - `AVTOMAGISTRAL_LEADS_WEBHOOK_URL`. SMTP используется только как fallback, если webhook не задан и SMTP-переменные заполнены. Реальные секреты не коммитятся.

## Заявки

Frontend отправляет все формы в `/api/leads`.

Поддерживаемые `formType`:

- `order` - заказ техники / перевозки;
- `cooperation` - сотрудничество;
- `callback` - обратный звонок.

API валидирует `name`, `phone`, `formType`. Для `order` также требуется выбранная услуга или описание задачи в комментарии. Ответы пользователю возвращают понятный JSON без stack trace и без раскрытия webhook URL.

## Структура

- `app/page.tsx` - главная страница лендинга.
- `components/AvtomagistralLanding.tsx` - UI лендинга и формы.
- `components/avtomagistral-landing.module.css` - стили лендинга.
- `app/api/leads/route.ts` - API приёма заявок.
- `lib/mail/send-avtomagistral-lead.ts` - SMTP fallback.
- `public/` - изображения и брендовые ассеты.

Проект не использует Prisma, CRM, Tilda, Gorilla, DNK, админку или базу данных.

## Production Deploy

Целевой путь на сервере:

```bash
/var/www/avtomagistral
```

Порт:

```bash
3002
```

Сервис: `avtomagistral.service`.

## Проверки

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Ручные проверки после деплоя:

1. На главной странице видна одна основная форма, а не три большие формы подряд.
2. Основная форма отправляет заявку с `formType: "order"`.
3. Popup сотрудничества отправляет заявку с `formType: "cooperation"`.
4. Popup обратного звонка отправляет заявку с `formType: "callback"`.
5. `/api/leads` возвращает `{ "ok": true }` при рабочем webhook.
6. При выключенном или битом webhook пользователь видит понятную ошибку.
7. Логи содержат formType и статус доставки, но не содержат персональные данные целиком, пароли или полный webhook URL.
8. Mobile-версия не показывает длинное полотно из трёх форм.
