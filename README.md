# DueMind

> Reminds what's due, keeps your mind clear.

Track expiry dates, reminders, and due items with peace of mind.

## Architecture

```
Client → Cloudflare Pages (React SPA)
           |
           +---- Supabase Auth (login/signup)
           |
           +---- Cloudflare Worker (REST API)
                      |
                      +---- Supabase (PostgreSQL)
```

## Features

- **Anything with a due date**: Domains, certificates, tokens, subscriptions, birthdays, food, documents
- **Multiple reminders**: Set reminders at 30d, 7d, 1d, 1h before
- **Notification channels**: Telegram, Email, Webhook, WeCom, Feishu, DingTalk
- **Simple UI**: Upcoming / All / Done

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Cloudflare Worker (REST API + Cron)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Deploy**: GitHub Actions

## Development

```bash
npm install
npm run dev:web
npm run dev:worker
```
