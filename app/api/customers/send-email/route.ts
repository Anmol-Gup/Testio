import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendTestimonialRequest } from '@/lib/mail';
import { getAppUrl } from '@/lib/url';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { customerId, productId, productName } = body;

        if (!customerId) {
            return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
        }

        // 1. Fetch customer first
        const { data: customerData, error: fetchErr } = await supabaseAdmin
            .from('customers')
            .select('id, email, product_id')
            .eq('id', customerId)
            .single();

        if (fetchErr || !customerData) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // 2. Resolve product details from payload or DB
        const email = customerData.email;
        let finalProductId = productId || customerData.product_id;
        let finalProductName = productName;
        let ownerPlan = 'free';

        if (finalProductId) {
            const { data: productData, error: productErr } = await supabaseAdmin
                .from('products')
                .select('id, name, user_id')
                .eq('id', finalProductId)
                .single();

            if (productErr || !productData) {
                return NextResponse.json({ error: 'Product not found for this customer' }, { status: 404 });
            }

            finalProductId = finalProductId || productData.id;
            finalProductName = finalProductName || productData.name;

            const { data: ownerData } = await supabaseAdmin
                .from('users')
                .select('plan')
                .eq('id', productData.user_id)
                .single();

            ownerPlan = (ownerData?.plan || 'free').toLowerCase();
        }

        if (!finalProductId || !finalProductName) {
            return NextResponse.json({ error: 'Missing product information' }, { status: 400 });
        }

        // 3. Send the email
        const submitLink = `${getAppUrl()}/submit/${finalProductId}?cid=${customerId}`;

        await sendTestimonialRequest({
            to: email,
            productName: finalProductName,
            submitLink: submitLink,
            ownerPlan
        });

        // 4. Update customer status to 'initial_sent'
        let { error: updateErr } = await supabaseAdmin
            .from('customers')
            .update({
                status: 'initial_sent',
                last_email_sent_at: new Date().toISOString()
            })
            .eq('id', customerId);

        // Handle schema drift: some DBs may not have last_email_sent_at yet.
        if (updateErr && (updateErr as any).code === 'PGRST204') {
            const fallback = await supabaseAdmin
                .from('customers')
                .update({ status: 'initial_sent' })
                .eq('id', customerId);
            updateErr = fallback.error;
        }

        if (updateErr) throw updateErr;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Send Email Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
