import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
    try {
        const { sessionId, userId } = await req.json();

        if (!sessionId || !userId) {
            return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 });
        }

        if (session.mode !== 'subscription') {
            return NextResponse.json({ error: 'Invalid checkout mode' }, { status: 400 });
        }

        if (session.status !== 'complete') {
            return NextResponse.json({ error: 'Checkout not completed' }, { status: 400 });
        }

        const metadataUserId = session.metadata?.userId;
        if (metadataUserId && metadataUserId !== userId) {
            return NextResponse.json({ error: 'Session user mismatch' }, { status: 403 });
        }

        const rawPlan = session.metadata?.plan;
        if (!rawPlan) {
            return NextResponse.json({ error: 'Missing plan in session metadata' }, { status: 400 });
        }

        const plan = String(rawPlan).toLowerCase();

        const customerId = session.customer as string | null;
        if (!customerId) {
            return NextResponse.json({ error: 'Missing customer id on session' }, { status: 400 });
        }

        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ plan, stripe_customer_id: customerId })
            .eq('id', userId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ plan, customerId });
    } catch (error: unknown) {
        console.error('Verify checkout error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
