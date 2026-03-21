import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as Stripe.StripeConfig['apiVersion'],
});

export async function createCheckoutSession(userId: string, plan: 'starter' | 'pro', customerEmail: string) {
    const priceId = plan === 'starter' ? process.env.STRIPE_STARTER_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
        customer_email: customerEmail,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
        metadata: {
            userId,
            plan,
        },
    });

    return session;
}
