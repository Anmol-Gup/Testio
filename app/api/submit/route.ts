import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const { productId, customerId, content, rating, customer_name, company } = await request.json();

        if (!productId || !content || !rating) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let customerEmail: string | null = null;
        if (customerId) {
            const { data: customerData, error: customerErr } = await supabaseAdmin
                .from('customers')
                .select('email')
                .eq('id', customerId)
                .eq('product_id', productId)
                .maybeSingle();

            if (customerErr) throw customerErr;
            customerEmail = customerData?.email || null;
        }

        if (customerEmail) {
            const { data: existingResponse, error: existingErr } = await supabaseAdmin
                .from('testimonials')
                .select('id')
                .eq('product_id', productId)
                .eq('customer_email', customerEmail)
                .limit(1)
                .maybeSingle();

            if (existingErr) throw existingErr;
            if (existingResponse) {
                return NextResponse.json(
                    { error: 'You have already responded for this product.' },
                    { status: 409 }
                );
            }
        }

        // 1. Save Testimonial
        let { error: testimonialErr } = await supabaseAdmin
            .from('testimonials')
            .insert([
                {
                    product_id: productId,
                    customer_id: customerId || null,
                    content,
                    rating,
                    customer_name: customer_name,
                    customer_email: customerEmail,
                    company: company || null,
                    source: customerId ? 'email' : 'direct', // Track if response came from email request
                    status: 'pending' // requires approval
                }
            ]);

        // Fallback: If customer_id or source column doesn't exist yet (schema drift)
        if (testimonialErr && (testimonialErr as any).code === 'PGRST204' || (testimonialErr as any).code === '42703') {
            console.warn('customer_id or source column missing, falling back to basic insert');

            const fallback = await supabaseAdmin
                .from('testimonials')
                .insert([
                    {
                        product_id: productId,
                        content,
                        rating,
                        customer_name: customer_name,
                        customer_email: customerEmail,
                        company: company || null,
                        status: 'pending'
                    }
                ]);
            testimonialErr = fallback.error;
        }

        if (testimonialErr) {
            console.error('Testimonial Insertion Error:', testimonialErr);
            throw testimonialErr;
        }

        // 2. Update Customer status to 'responded'
        if (customerId) {
            const { error: updateErr } = await supabaseAdmin
                .from('customers')
                .update({ status: 'responded' })
                .eq('id', customerId);
            if (updateErr) throw updateErr;
        }

        return NextResponse.json({
            success: true,
            message: 'Testimonial submitted successfully! It is currently pending approval.'
        });

    } catch (error: any) {
        console.error('Submission Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
