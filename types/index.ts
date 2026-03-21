export type PlanType = 'free' | 'starter' | 'pro';

export interface Profile {
    id: string;
    plan: PlanType;
    stripe_customer_id?: string;
    customer_count_this_month: number;
    last_reset_date: string;
}

export interface Product {
    id: string;
    user_id: string;
    name: string;
    website_url?: string;
    slug: string;
    created_at: string;
}

export interface Customer {
    id: string;
    product_id: string;
    email: string;
    name?: string;
    upgrade_date: string;
    status: 'scheduled' | 'initial_sent' | 'reminder_sent' | 'responded';
    last_email_sent_at?: string;
    created_at: string;
}

export interface Testimonial {
    id: string;
    product_id: string;
    customer_id?: string;
    content: string;
    author_name: string;
    author_company?: string;
    approved: boolean;
    created_at: string;
}
