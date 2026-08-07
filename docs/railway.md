# Деплой на Railway

Проект разворачивается в один проект Railway из четырёх сервисов:

| Сервис     | Что это                     | Источник                                     |
| ---------- | --------------------------- | -------------------------------------------- |
| `Postgres` | база данных                 | шаблон Railway                               |
| `Redis`    | очередь BullMQ              | шаблон Railway                               |
| `web`      | Next.js приложение          | этот репозиторий, `railway.json`             |
| `worker`   | durable execution worker    | этот репозиторий, `railway.worker.json`      |

Оба сервиса приложения собираются из одного репозитория, но разными
Dockerfile'ами — `docker/web.railway.Dockerfile` и
`docker/worker.railway.Dockerfile`.

## 1. Сгенерировать секреты

`BETTER_AUTH_SECRET` (строка 32+ символов):

```bash
powershell -Command "$b=New-Object byte[] 32; ([System.Security.Cryptography.RNGCryptoServiceProvider]::new()).GetBytes($b); [Convert]::ToBase64String($b)"
```

`APP_ENCRYPTION_KEY` (base64 от ровно 32 байт) — генерируется той же командой,
но значение должно быть **другим**. Этот ключ шифрует учётные данные
коннекторов: после первого запуска менять его нельзя, иначе все сохранённые
подключения перестанут расшифровываться.

## 2. Создать проект и базы

1. [railway.com/new](https://railway.com/new) → **Deploy from GitHub repo** →
   выбрать этот репозиторий. Railway создаст первый сервис — переименовать его
   в `web`.
2. В том же проекте **+ New** → **Database** → **Add PostgreSQL**.
3. **+ New** → **Database** → **Add Redis**.

## 3. Настроить сервис `web`

Settings:

- **Config-as-code file**: `railway.json` (подхватывается по умолчанию).
- **Networking** → **Generate Domain**. Домен нужен до первой сборки, потому
  что `NEXT_PUBLIC_APP_URL` вшивается в клиентский бандл.

Variables → Raw Editor, блок `=== Service: web ===` из
[`.env.railway.example`](../.env.railway.example). Заполнить пустые
`BETTER_AUTH_SECRET` и `APP_ENCRYPTION_KEY`.

Билдер, стартовая команда, healthcheck `/api/health` и `preDeployCommand`
(`pnpm db:migrate`) уже описаны в `railway.json` — руками их задавать не нужно.
Миграции применяются автоматически перед каждым деплоем `web`.

## 4. Настроить сервис `worker`

1. **+ New** → **GitHub Repo** → тот же репозиторий. Назвать сервис `worker`.
2. Settings → **Config-as-code file**: `railway.worker.json`.
3. Домен **не** выдавать — сервис фоновый.
4. Variables → Raw Editor, блок `=== Service: worker ===` из
   `.env.railway.example` (раскомментировать).

`BETTER_AUTH_SECRET` и `APP_ENCRYPTION_KEY` должны совпадать со значениями
сервиса `web`, иначе worker не расшифрует учётные данные коннекторов.

## 5. Порядок первого деплоя

1. Дождаться, пока поднимутся `Postgres` и `Redis`.
2. Задеплоить `web` — его `preDeployCommand` накатит миграции.
3. Задеплоить `worker`.
4. Проверить `https://<домен>/api/health` — ожидается
   `{"status":"ok","checks":{"database":{"status":"ok"},"queue":{"status":"ok"}}}`.

Healthcheck `web` отдаёт 503, пока Postgres или Redis недоступны, поэтому
деплой упадёт при неверных `DATABASE_URL` / `REDIS_URL` — это ожидаемо и
диагностируется по телу ответа.

## 6. Данные для демо

Сид (`pnpm db:seed`) в продакшене не запускается — так и задумано.
Если демо-данные всё же нужны, разово выполнить локально с Railway CLI:

```bash
railway run --service web pnpm db:seed
```

## Почта и подтверждение адреса

При `NODE_ENV=production` вход требует подтверждённого email
(`requireEmailVerification` в `apps/web/lib/auth.ts`). Без рабочей отправки
почты аккаунт невозможно ни подтвердить, ни войти под ним — поэтому почта
здесь не опциональна, а обязательна.

`SMTP_URL` — вопреки имени, **не** строка `smtp://...`. Приложение делает
`POST` с телом `{to, subject, text, from}` на указанный URL и передаёт
`EMAIL_API_KEY` как bearer-токен. Под это подходит Resend без переходников:

```text
SMTP_URL=https://api.resend.com/emails
EMAIL_API_KEY=<ключ из Resend>
EMAIL_FROM=Rezaru <onboarding@resend.dev>
```

Адрес `onboarding@resend.dev` — песочница Resend: письма уходят только на
почту владельца аккаунта, домен подтверждать не нужно. Для реальных
пользователей нужен свой домен, подтверждённый в Resend, и `EMAIL_FROM` на
этом домене.

## Что осталось опциональным

- **S3 / артефакты.** `S3CompatibleArtifactStore` задаёт границу хранилища, но
  транспорт нужно внедрять отдельно. В docker-compose эту роль играет MinIO;
  на Railway это либо внешний бакет (R2, S3), либо шаблон MinIO из
  маркетплейса. Без него платформа работает.
- **AI.** По умолчанию `AI_PROVIDER=rule-based` — ключи не нужны. Для
  полноценной генерации workflow задать `AI_PROVIDER`, `AI_API_KEY`,
  `AI_BASE_URL`, `AI_MODEL`.
- **OAuth, SMTP, Stripe.** См. [environment.md](environment.md) и
  [billing.md](billing.md). Callback URL'ы указывать на выданный Railway домен.

## Диагностика сборки

- Сборка идёт из корня монорепозитория, `.dockerignore` уже исключает
  `node_modules`, `.next`, `.git` и `.env`.
- `pnpm install --frozen-lockfile` требует, чтобы `pnpm-lock.yaml` был
  актуален относительно всех `package.json`. Если лок разъехался — сборка
  падает на этом шаге.
- Образы намеренно однослойные (без `.next/standalone`): в рантайме остаются
  pnpm, Prisma CLI и сгенерированный query engine, собранный в том же образе.
  Это тяжелее, но исключает класс ошибок «Prisma engine not found».
