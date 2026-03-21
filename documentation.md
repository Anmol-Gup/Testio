# Testio Documentation

## 1. What This Product Does
Testio automates testimonial collection for SaaS founders:

1. Founder creates a product in dashboard.
2. Founder adds customers (email list).
3. Testio sends feedback request emails (immediate or scheduled).
4. Customers submit feedback via hosted form (`/submit/:productId?cid=:customerId`).
5. Founder reviews and approves testimonials.
6. Approved testimonials are rendered on founder website via embeddable widget script.

Core value: less manual follow-up, faster social proof.

---

## 2. High-Level Architecture
### Frontend
- Next.js App Router UI
- Dashboard routes under `app/(dashboard)/*`
- Public submit form under `app/submit/[id]/page.tsx`
- Public widget test pages under `app/widget-test/*`

### Backend
- Next.js API routes under `app/api/*`
- Supabase (DB + auth)
- Nodemailer SMTP for emails
- Stripe for billing
- Gemini endpoint for AI polish (`/api/ai/polish`)

### Data Flow (summary)
1. Dashboard writes products/customers/testimonials to Supabase.
2. Email send route builds submit link with `cid`.
3. Submit API stores testimonial and marks customer `responded`.
4. Cron route processes delayed initial and reminder emails.
5. Widget route serves JS that renders approved testimonials.

---

## 3. End-to-End User Journey (Example)
Example product: `Acme CRM`.

1. Founder signs up and verifies email.
2. Founder creates product `Acme CRM` in Products page.
3. Founder adds customer `jane@client.com`.
4. If "Send now" enabled:
   - `/api/customers/send-email` sends request email immediately.
   - customer status -> `initial_sent`
5. Customer clicks email CTA:
   - opens `/submit/{productId}?cid={customerId}`
6. Customer submits feedback.
7. `/api/submit`:
   - inserts testimonial with status `pending`
   - updates customer status -> `responded`
8. Founder approves testimonial in Testimonials page.
9. Founder embeds widget on website:
   - `<div id="testio-widget"></div>`
   - `<script src="http://localhost:3000/api/widget?id={productId}" defer></script>`
10. Widget shows approved testimonials only.

---

## 4. Core Data Model
Main tables used by current code:

- `users`: plan, stripe customer id, account metadata
- `products`: product config, widget settings, owner id
- `customers`: product_id, email, status, last_email_sent_at
- `testimonials`: product_id, content, customer_name, customer_email, rating, company, status

### Customer status lifecycle
- `scheduled` -> waiting for initial email
- `initial_sent` -> initial email sent
- `responded` -> customer submitted form
- `reminder_sent` -> reminder has been sent

Reminder cron targets only `initial_sent` records older than 3 days.

---

## 5. Environment Variables
Use `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@testio.io

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=

GEMINI_API_KEY=
```

---

## 6. API Documentation
## `POST /api/auth/signup`
Creates auth user + `users` row and sends verification email.

Request:
```json
{ "email": "founder@acme.com", "password": "secret", "name": "Acme Founder" }
```

Response:
```json
{ "success": true, "message": "Account created! Please check your email to verify your account." }
```

## `POST /api/customers/send-email`
Sends immediate testimonial request email.

Request:
```json
{
  "customerId": "uuid",
  "productId": "uuid",
  "productName": "Acme CRM"
}
```

Behavior:
- Fetch customer + product
- Build submit link `/submit/{productId}?cid={customerId}`
- Send email (brand style depends on owner plan)
- Update customer status to `initial_sent`

## `POST /api/submit`
Receives submitted testimonial from customer form.

Request:
```json
{
  "productId": "uuid",
  "customerId": "uuid",
  "content": "Great product",
  "rating": 5,
  "customer_name": "Jane Doe",
  "company": "Acme Inc"
}
```

Behavior:
- Prevent duplicate response for same product/email
- Insert testimonial with status `pending`
- Fill `customer_email` from `customers.email`
- Update customer status to `responded`

## `GET /api/cron`
Runs scheduled automation.

Auth header:
```http
authorization: Bearer <CRON_SECRET>
```

Behavior:
- Sends initial emails for customers:
  - `status='scheduled'`
  - `created_at <= now - 3 days`
- Sends reminder emails for customers:
  - `status='initial_sent'`
  - `last_email_sent_at <= now - 3 days`
- Sets reminder status to `reminder_sent`

## `GET /api/widget?id={productId}`
Returns JavaScript payload for embed widget.

Behavior:
- Reads `products.widget_settings`
- Fetches approved testimonials only
- Injects HTML/CSS into `#testio-widget`

## `POST /api/ai/polish`
Rewrites testimonial text with Gemini.

Request:
```json
{ "text": "it was good app helped us" }
```

Response:
```json
{ "polishedText": "It helped our team significantly and was very easy to use." }
```

## `POST /api/stripe/checkout`
Creates Stripe checkout session for starter/pro plan.

## `POST /api/stripe/portal`
Creates Stripe portal session.
- `action: "cancel"` opens direct cancellation flow and redirects back.

## `POST /api/stripe/webhook`
Handles Stripe events:
- `checkout.session.completed`: updates plan + stripe customer id
- `customer.subscription.deleted`: downgrades plan to free

Notes:
- Configure your Stripe webhook endpoint to point to `/api/stripe/webhook`.
- A compatibility endpoint also exists at `/api/v1/stripe-billingnv` to avoid 404s in older setups.

---

## 6.1 Access API via Swagger
Swagger UI is available from the dashboard route:

- Local URL: `http://localhost:3000/api-docs`
- OpenAPI source file: `public/openapi.json`

Steps:
1. Start app:
```bash
npm run dev
```
2. Log in to Testio dashboard.
3. Open `http://localhost:3000/api-docs`.
4. Use the Swagger UI to browse endpoints, request schema, and test calls.

Notes:
- Swagger page loads OpenAPI spec from `/openapi.json`.
- If page is blank, confirm `public/openapi.json` exists and hard refresh the browser.

---

## 7. How To Test Scheduled + Reminder Email Logic
## Pre-requisites
1. SMTP credentials valid.
2. At least one product and customer present.
3. `customers.last_email_sent_at` column exists:

```sql
alter table customers
add column if not exists last_email_sent_at timestamptz;
```

## Trigger cron manually
```bash
curl -X GET "http://localhost:3000/api/cron" \
  -H "authorization: Bearer YOUR_CRON_SECRET"
```

## Case A: User already submitted -> no reminder
1. Set a customer as reminder-eligible:
```sql
update customers
set status = 'initial_sent',
    last_email_sent_at = now() - interval '4 days'
where id = 'CUSTOMER_ID';
```
2. Submit form using same `cid`.
3. Confirm status became `responded`:
```sql
select status from customers where id='CUSTOMER_ID';
```
4. Run cron.
5. Verify no reminder sent and status remains `responded`.

## Case B: User has not submitted -> reminder sent
1. Set customer:
```sql
update customers
set status = 'initial_sent',
    last_email_sent_at = now() - interval '4 days'
where id = 'CUSTOMER_ID';
```
2. Do not submit form.
3. Run cron.
4. Verify:
```sql
select status,last_email_sent_at from customers where id='CUSTOMER_ID';
```
Expected status: `reminder_sent`.

---

## 7.1. How To Test Monthly Email Limit Reset
Usage is calculated based on customers created from the first day of the *current* calendar month.

### To "Reset" usage for testing:
Run this SQL in your Supabase SQL Editor to move all records from the current month to the previous month, clearing your active usage counter:

```sql
UPDATE customers 
SET created_at = (CURRENT_DATE - INTERVAL '1 month')
WHERE created_at >= date_trunc('month', CURRENT_DATE);
```

### To test a single customer reset:
```sql
UPDATE customers 
SET created_at = (CURRENT_DATE - INTERVAL '1 month')
WHERE id = 'CUSTOMER_ID';
```

---

## 8. How To Test Widget
## Dashboard method
1. Approve at least one testimonial for a product.
2. Use embed snippet:
```html
<div id="testio-widget"></div>
<script src="http://localhost:3000/api/widget?id=PRODUCT_ID" defer></script>
```

## Local static page test
Create `index.html`:
```html
<!doctype html>
<html>
  <body>
    <div id="testio-widget"></div>
    <script src="http://localhost:3000/api/widget?id=PRODUCT_ID" defer></script>
  </body>
</html>
```

If nothing renders:
1. ensure testimonials exist with `status='approved'`
2. ensure `PRODUCT_ID` is correct
3. hard refresh (widget JS cached 60s)

---

## 9. Branding Behavior in Email
Current behavior:
- Sender name: `${productName} Team`
- Main email body is product-branded
- Free plan only: subtle footer `Sent via Testio`
- Paid plans: no Testio attribution in body

---

## 10. Useful Troubleshooting
## "Customer or Product not found"
- Verify `customerId` exists and belongs to target product.
- Send payload with `customerId + productId + productName`.

## `last_email_sent_at` column errors
- Add missing column with migration SQL above.

## Duplicate submissions
- `/api/submit` returns HTTP `409` if same customer email already responded for same product.

---

## 11. Suggested Production Hardening
1. Add DB constraints:
   - unique `(product_id, lower(email))` on customers
2. Add unique protection for testimonials per `(product_id, customer_email)` if needed.
3. Add idempotency key handling for cron/email retries.
4. Add request auth/rate limits on internal APIs.
