import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        console.error('Webhook signature check failed:', err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan } = session.metadata || {};
        const customerId = session.customer as string;

        if (userId && plan) {
            const { error } = await supabaseAdmin
                .from('users')
                .update({ 
                    plan: String(plan).toLowerCase(),
                    stripe_customer_id: customerId
                })
                .eq('id', userId);

            if (error) {
                console.error('Failed to update plan/customer in DB:', error.message);
            }
        }
    } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Reset plan to Free when subscription is cancelled
        const { error } = await supabaseAdmin
            .from('users')
            .update({ plan: 'free' })
            .eq('stripe_customer_id', customerId);

        if (error) {
            console.error('Failed to reset plan in DB:', error.message);
        }
    } else if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        // In a real app, you'd map the Stripe Price ID back to your plan name
        // For now, if it's updated and active, we assume it's still the paid plan
        // or we could look up the product name if needed.
    }

    return NextResponse.json({ received: true });
}
