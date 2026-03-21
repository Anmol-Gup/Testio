import { POST } from '@/app/api/stripe/webhook/route';

// Compatibility route for webhook URLs like `/api/v1/stripe/webhook`.
// Prefer using `/api/stripe/webhook` going forward.
export { POST };
