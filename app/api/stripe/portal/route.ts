import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { userId, action } = await req.json();

        // Fetch stripe_customer_id from database
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (userError || !user?.stripe_customer_id) {
            return NextResponse.json({ error: 'Stripe customer record not linked to your account. This usually happens if the plan was updated manually in the database without a Stripe subscription.' }, { status: 404 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const defaultReturnUrl = `${appUrl}/billing`;

        // If requested, open Stripe directly in the subscription-cancel flow and
        // auto-redirect back to billing after completion.
        if (action === 'cancel') {
            const subscriptions = await stripe.subscriptions.list({
                customer: user.stripe_customer_id,
                status: 'all',
                limit: 10,
            });

            const activeSubscription = subscriptions.data.find((sub) =>
                ['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status)
            );

            if (!activeSubscription) {
                return NextResponse.json({ error: 'No active subscription found to cancel.' }, { status: 404 });
            }

            if (activeSubscription.cancel_at_period_end) {
                const session = await stripe.billingPortal.sessions.create({
                    customer: user.stripe_customer_id,
                    return_url: defaultReturnUrl,
                });

                return NextResponse.json({ url: session.url });
            }

            const cancelSession = await stripe.billingPortal.sessions.create({
                customer: user.stripe_customer_id,
                return_url: defaultReturnUrl,
                flow_data: {
                    type: 'subscription_cancel',
                    subscription_cancel: {
                        subscription: activeSubscription.id,
                    },
                    after_completion: {
                        type: 'redirect',
                        redirect: {
                            return_url: `${appUrl}/billing?canceled=true&source=portal`,
                        },
                    },
                },
            });

            return NextResponse.json({ url: cancelSession.url });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url: defaultReturnUrl,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        console.error('Stripe Portal error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
