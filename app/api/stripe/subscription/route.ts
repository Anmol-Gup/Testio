import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
    'active',
    'trialing',
    'past_due',
    'unpaid',
]);

async function reconcileStripeCustomerId(userId: string) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) return null;

    const email = data.user?.email;
    if (!email) return null;

    // Best-effort: find a Stripe customer by email.
    // This is helpful when earlier checkouts used `customer_email` and we never persisted
    // `stripe_customer_id` due to a missing webhook.
    const customers = await stripe.customers.list({ email, limit: 10 });

    // Prefer a customer that was created for this user (if metadata exists), otherwise pick the newest.
    const match = customers.data.find((c) => (c.metadata as Record<string, string> | undefined)?.userId === userId);
    const chosen = match ?? customers.data[0] ?? null;
    if (!chosen) return null;

    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: chosen.id })
        .eq('id', userId);

    if (updateError) return null;
    return chosen.id;
}

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const { data: userRow, error: userError } = await supabaseAdmin
            .from('users')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (userError) {
            return NextResponse.json({ error: userError.message }, { status: 500 });
        }

        let customerId = userRow?.stripe_customer_id as string | null | undefined;
        if (!customerId) {
            customerId = await reconcileStripeCustomerId(userId);
        }

        if (!customerId) {
            return NextResponse.json({
                hasCustomer: false,
                hasAnySubscription: false,
                isActive: false,
                cancelAtPeriodEnd: false,
                currentPeriodEnd: null,
                status: null,
            });
        }

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 10,
        });

        const activeSubscription = subscriptions.data.find((sub) => ACTIVE_STATUSES.has(sub.status));
        const chosen = activeSubscription ?? subscriptions.data[0] ?? null;

        const currentPeriodEndUnix = (activeSubscription as unknown as { current_period_end?: number }).current_period_end;
        const currentPeriodEnd = typeof currentPeriodEndUnix === 'number'
            ? new Date(currentPeriodEndUnix * 1000).toISOString()
            : null;

        return NextResponse.json({
            hasCustomer: true,
            hasAnySubscription: subscriptions.data.length > 0,
            isActive: !!activeSubscription,
            cancelAtPeriodEnd: activeSubscription?.cancel_at_period_end ?? false,
            currentPeriodEnd,
            status: chosen?.status ?? null,
        });
    } catch (error: unknown) {
        console.error('Stripe subscription status error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
