# Testio

Testio automates testimonial collection for SaaS founders: send requests anytime (immediately or scheduled), follow up once, and display approved testimonials on your website with a lightweight embeddable widget.

## What You Can Do
- Create products and add customers (email list)
- Send testimonial requests immediately, or schedule them (e.g., 3 days after upgrade)
- Automatically follow up once if a customer hasn’t responded
- Review and approve testimonials before publishing
- Embed a “social proof” widget on your website

## Tech Stack
- Next.js App Router (React 18)
- Supabase (Auth + Postgres)
- Stripe (subscriptions + customer portal)
- Nodemailer (SMTP email sending)
- Swagger UI at `/api-docs` (spec: `public/openapi.json`)

## Local Development
Requirements: Node.js 20+ and npm.

1. Install deps:
   ```bash
   npm install
   ```
2. Create your env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill `.env.local` (Supabase + SMTP + Stripe). Optional: add `GEMINI_API_KEY` for AI polish.
4. Start dev server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

## Database
This app uses Supabase tables like `users`, `products`, `customers`, and `testimonials` (see `documentation.md` for the expected fields).

There’s also a starter schema in `schema.sql`, but it uses a legacy `profiles` table name — adjust it to match your current DB schema if needed.

## Stripe Setup (Webhooks + Billing)
Set these in `.env.local`:
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

Webhook endpoint (recommended):
- `POST /api/stripe/webhook`

Compatibility endpoints (to avoid 404s if you previously configured an older URL):
- `POST /api/v1/stripe/webhook`
- `POST /api/v1/stripe-billing/stripe/webhook`

Local webhook forwarding (Stripe CLI example):
```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```
Use the printed `whsec_...` value as `STRIPE_WEBHOOK_SECRET`.

## Key Routes
Dashboard (authenticated):
- `/products`, `/customers`, `/testimonials`, `/billing`

Public:
- Submit form: `/submit/[productId]?cid=[customerId]`
- Widget JS: `GET /api/widget?id=[productId]`

Embed example:
```html
<div id="testio-widget"></div>
<script src="http://localhost:3000/api/widget?id=YOUR_PRODUCT_ID" defer></script>
```

## Automation (Cron)
`GET /api/cron` sends scheduled initial emails and reminder follow-ups (secured with `CRON_SECRET`). See `documentation.md` for details.
