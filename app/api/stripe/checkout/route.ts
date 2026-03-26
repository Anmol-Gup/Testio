import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAppUrl } from '@/lib/url';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLANS: Record<string, { price: number; name: string }> = {
    starter: { price: 1900, name: 'Starter Plan' },
    pro: { price: 3900, name: 'Pro Plan' },
};

export async function POST(req: Request) {
    try {
        const { plan, userId, email } = await req.json();

        if (!plan || !userId || !email) {
            return NextResponse.json({ error: 'Missing plan, userId, or email' }, { status: 400 });
        }

        const planKey = String(plan).toLowerCase();
        const planConfig = PLANS[planKey];
        if (!planConfig) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // Ensure the user has a Stripe customer id linked before starting checkout.
        const { data: userRow, error: userError } = await supabaseAdmin
            .from('users')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (userError) {
            return NextResponse.json({ error: `Failed to load user record: ${userError.message}` }, { status: 500 });
        }

        let customerId = (userRow?.stripe_customer_id as string | null) ?? null;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: { userId },
            });
            customerId = customer.id;

            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({ stripe_customer_id: customerId })
                .eq('id', userId);

            if (updateError) {
                return NextResponse.json({ error: `Failed to link Stripe customer: ${updateError.message}` }, { status: 500 });
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: planConfig.name,
                            description: `Testio ${planConfig.name} - Monthly subscription`,
                        },
                        unit_amount: planConfig.price,
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            customer: customerId,
            metadata: { userId, plan: planKey },
            success_url: `${getAppUrl()}/billing?success=true&plan=${planKey}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getAppUrl()}/billing?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        console.error('Stripe error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
