import { POST } from '@/app/api/stripe/webhook/route';

// Compatibility route for older Stripe webhook URLs.
// Prefer using `/api/stripe/webhook` going forward.
export { POST };
