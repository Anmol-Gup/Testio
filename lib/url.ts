/**
 * Returns the base URL for the application.
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (if set and not localhost, or if we're in development)
 * 2. VERCEL_URL (if set)
 * 3. http://localhost:3000 (fallback)
 */
export const getAppUrl = () => {
    let url = process.env.NEXT_PUBLIC_APP_URL;

    // In development or if it's explicitly set to something other than localhost, use it
    if (url && (process.env.NODE_ENV === 'development' || !url.includes('localhost'))) {
        return url.replace(/\/$/, '');
    }

    // On Vercel, VERCEL_URL is automatically set
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // Default to localhost
    return 'http://localhost:3000';
};
