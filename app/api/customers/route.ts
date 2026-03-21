import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { addDays } from 'date-fns';

export async function POST(request: Request) {
    try {
        const { email, name, productId } = await request.json();

        if (!email || !productId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get current user (mocked for now)
        // In a real app, we'd use: const { data: { user } } = await supabase.auth.getUser();
        const userId = 'mock-user-id';

        // 2. Check plan limits (mocked)
        const canAddCustomer = true; // Logic to check profile.customer_count_this_month < limits[profile.plan]

        if (!canAddCustomer) {
            return NextResponse.json({ error: 'Monthly limit reached for your plan' }, { status: 403 });
        }

        // 3. Add customer to database
        // In a real app:
        // const { data, error } = await supabase
        //   .from('customers')
        //   .insert([
        //     { 
        //       product_id: productId, 
        //       email, 
        //       name, 
        //       status: 'scheduled',
        //       upgrade_date: new Date().toISOString()
        //     }
        //   ]);

        console.log(`Scheduling testimonial email for ${email} in 3 days.`);

        return NextResponse.json({
            success: true,
            message: 'Customer added and email scheduled for 3 days from now.'
        });

    } catch (error) {
        console.error('Error adding customer:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
