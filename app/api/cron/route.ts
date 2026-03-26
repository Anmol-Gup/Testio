import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendTestimonialRequest, sendReminderRequest } from '@/lib/mail';
import { subDays, subMinutes } from 'date-fns';
import { getAppUrl } from '@/lib/url';

export async function GET(request: Request) {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = {
            initialSent: 0,
            remindersSent: 0,
            errors: [] as string[]
        };
        const planCache = new Map<string, string>();

        const initialDelay = parseInt(process.env.NEXT_PUBLIC_TESTIO_INITIAL_EMAIL_DELAY_MINUTES || '4320'); // 4320 mins = 3 days
        const initialThreshold = subMinutes(new Date(), initialDelay).toISOString();

        // 1. Process Initial Emails (Status: 'scheduled', based on delay)
        const { data: initialBatch, error: e1 } = await supabaseAdmin
            .from('customers')
            .select('*, products(id, name, user_id)')
            .eq('status', 'scheduled')
            .lte('created_at', initialThreshold);

        if (e1) throw e1;

        for (const customer of (initialBatch || [])) {
            try {
                // Safety Check: Verify they haven't responded yet (status drift check)
                let query = supabaseAdmin
                    .from('testimonials')
                    .select('id', { count: 'exact', head: true })
                    .eq('product_id', customer.products.id);
                
                // Try to use customer_id if possible, otherwise fallback to email
                const { count: hasResponded, error: checkError } = await query.or(`customer_id.eq.${customer.id},customer_email.eq.${customer.email}`);
                
                let finalHasResponded = hasResponded;
                if (checkError && (checkError as any).code === 'PGRST204') {
                    // Fallback to email only check
                    const { count: emailCount } = await supabaseAdmin
                        .from('testimonials')
                        .select('id', { count: 'exact', head: true })
                        .eq('product_id', customer.products.id)
                        .eq('customer_email', customer.email);
                    finalHasResponded = emailCount;
                }

                if (finalHasResponded && finalHasResponded > 0) {
                    await supabaseAdmin.from('customers').update({ status: 'responded' }).eq('id', customer.id);
                    continue;
                }

                const submitLink = `${getAppUrl()}/submit/${customer.products.id}?cid=${customer.id}`;
                const ownerId = customer.products.user_id as string | undefined;
                let ownerPlan = ownerId ? planCache.get(ownerId) : undefined;
                if (!ownerPlan && ownerId) {
                    const { data: ownerData } = await supabaseAdmin
                        .from('users')
                        .select('plan')
                        .eq('id', ownerId)
                        .single();
                    ownerPlan = (ownerData?.plan || 'free').toLowerCase();
                    planCache.set(ownerId!, ownerPlan!);
                }
                await sendTestimonialRequest({
                    to: customer.email,
                    productName: customer.products.name,
                    submitLink: submitLink,
                    ownerPlan: ownerPlan || 'free'
                });

                await supabaseAdmin
                    .from('customers')
                    .update({
                        status: 'initial_sent',
                        last_email_sent_at: new Date().toISOString()
                    })
                    .eq('id', customer.id);

                results.initialSent++;
            } catch (err: any) {
                results.errors.push(`Initial Email Error (${customer.email}): ${err.message}`);
            }
        }

        const reminderDelay = parseInt(process.env.NEXT_PUBLIC_TESTIO_REMINDER_EMAIL_DELAY_MINUTES || '4320');
        const reminderThreshold = subMinutes(new Date(), reminderDelay).toISOString();

        // 2. Process Reminders (Status: 'initial_sent', based on delay)
        const { data: reminderBatch, error: e2 } = await supabaseAdmin
            .from('customers')
            .select('*, products(id, name, user_id)')
            .eq('status', 'initial_sent')
            .lte('last_email_sent_at', reminderThreshold);

        if (e2) throw e2;

        for (const customer of (reminderBatch || [])) {
            try {
                // Safety Check: Verify they haven't responded yet
                let query = supabaseAdmin
                    .from('testimonials')
                    .select('id', { count: 'exact', head: true })
                    .eq('product_id', customer.products.id);

                const { count: hasResponded, error: checkError } = await query.or(`customer_id.eq.${customer.id},customer_email.eq.${customer.email}`);
                
                let finalHasResponded = hasResponded;
                if (checkError && (checkError as any).code === 'PGRST204') {
                    const { count: emailCount } = await supabaseAdmin
                        .from('testimonials')
                        .select('id', { count: 'exact', head: true })
                        .eq('product_id', customer.products.id)
                        .eq('customer_email', customer.email);
                    finalHasResponded = emailCount;
                }

                if (finalHasResponded && finalHasResponded > 0) {
                    await supabaseAdmin.from('customers').update({ status: 'responded' }).eq('id', customer.id);
                    continue;
                }

                const submitLink = `${getAppUrl()}/submit/${customer.products.id}?cid=${customer.id}`;
                const ownerId = customer.products.user_id as string | undefined;
                let ownerPlan = ownerId ? planCache.get(ownerId) : undefined;
                if (!ownerPlan && ownerId) {
                    const { data: ownerData } = await supabaseAdmin
                        .from('users')
                        .select('plan')
                        .eq('id', ownerId)
                        .single();
                    ownerPlan = (ownerData?.plan || 'free').toLowerCase();
                    planCache.set(ownerId!, ownerPlan!);
                }
                await sendReminderRequest({
                    to: customer.email,
                    productName: customer.products.name,
                    submitLink: submitLink,
                    ownerPlan: ownerPlan || 'free'
                });

                await supabaseAdmin
                    .from('customers')
                    .update({
                        status: 'reminder_sent',
                        last_email_sent_at: new Date().toISOString()
                    })
                    .eq('id', customer.id);

                results.remindersSent++;
            } catch (err: any) {
                results.errors.push(`Reminder Email Error (${customer.email}): ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: results
        });

    } catch (error: any) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
