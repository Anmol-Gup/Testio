'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';

type Testimonial = {
    id: string;
    customer_name: string;
    company?: string | null;
    content: string;
    rating?: number | null;
};

export default function TestimonialWidget({ params }: { params: { id: string } }) {
    const [ownerPlan, setOwnerPlan] = useState<string>('');
    const [testimonials, setTestimonials] = useState<Testimonial[]>([
        { id: '1', customer_name: 'Mark Z', company: 'DevFlow', content: 'This tool saved me hours of manual work! The automation is just perfect.', rating: 5 },
        { id: '2', customer_name: 'Sarah J', company: 'DesignCloud', content: 'The easiest way to get feedback from customers I have ever seen.', rating: 5 }
    ]);

    useEffect(() => {
        const fetchData = async () => {
             const { data: prod } = await supabase.from('products').select('user_id').eq('id', params.id).single();
             if (prod) {
                 const { data: user } = await supabase.from('users').select('plan').eq('id', prod.user_id).single();
                 setOwnerPlan(user?.plan || 'free');

                 const { data: tests } = await supabase.from('testimonials').select('*').eq('product_id', params.id).eq('status', 'approved');
                 setTestimonials(tests || []);
             }
        };
        fetchData();
    }, [params.id]);

    const showBranding = ownerPlan.toLowerCase() === 'free';

    return (
        <div style={{
            background: 'transparent',
            padding: '1rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {testimonials.map((t) => (
                    <div key={t.id} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '0.75rem' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={14} fill={star <= (t.rating || 5) ? "#fbbf24" : "#e2e8f0"} color={star <= (t.rating || 5) ? "#fbbf24" : "#e2e8f0"} />
                            ))}
                        </div>
                        <p style={{
                            fontSize: '0.9375rem',
                            lineHeight: '1.5',
                            color: '#1e293b',
                            marginBottom: '1rem'
                        }}>“{t.content}”</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                background: '#f1f5f9',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#64748b'
                            }}>{(t.customer_name || 'A')[0]}</div>
                            <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{t.customer_name}</div>
                                {t.company && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.company}</div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showBranding && (
                <div style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                }}>
                    Powered by <a href="https://testio.io" target="_blank" style={{ fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>Testio</a>
                </div>
            )}
        </div>
    );
}
