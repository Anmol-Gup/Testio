'use client';

import { useState, useEffect } from 'react';
import { Send, CheckCircle2, Loader2, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';

export default function SubmitTestimonialPage({ params }: { params: { id: string } }) {
    const searchParams = useSearchParams();
    const [productName, setProductName] = useState('Loading...');
    const [content, setContent] = useState('');
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [rating, setRating] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingExisting, setCheckingExisting] = useState(true);
    const [alreadyResponded, setAlreadyResponded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ownerPlan, setOwnerPlan] = useState<string>('');
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await supabase
                    .from('products')
                    .select('name, user_id')
                    .eq('id', params.id)
                    .single();

                if (data) {
                    setProductName(data.name);
                    // Fetch owner's plan from public.users table
                    const { data: owner } = await supabase
                        .from('users')
                        .select('plan')
                        .eq('id', data.user_id)
                        .single();

                    setOwnerPlan(owner?.plan || 'free');
                }
                else {
                    setProductName('Product');
                    setOwnerPlan('free');
                }
            } catch (err) {
                console.error('Error fetching context:', err);
                setOwnerPlan('free');
            }
        };
        fetchProduct();
    }, [params.id]);

    useEffect(() => {
        const customerId = searchParams.get('cid');
        if (!customerId) {
            setCheckingExisting(false);
            return;
        }

        const checkExistingResponse = async () => {
            try {
                const { data: customerData, error: customerErr } = await supabase
                    .from('customers')
                    .select('status, email')
                    .eq('id', customerId)
                    .eq('product_id', params.id)
                    .maybeSingle();

                if (customerErr) throw customerErr;
                if (!customerData) {
                    setCheckingExisting(false);
                    return;
                }

                if (customerData.status === 'responded') {
                    setAlreadyResponded(true);
                    return;
                }

                if (!customerData.email) {
                    setCheckingExisting(false);
                    return;
                }

                const { count, error: testimonialErr } = await supabase
                    .from('testimonials')
                    .select('id', { count: 'exact', head: true })
                    .eq('product_id', params.id)
                    .eq('customer_email', customerData.email);

                if (testimonialErr) throw testimonialErr;
                if ((count || 0) > 0) {
                    setAlreadyResponded(true);
                }
            } catch (err) {
                console.error('Error checking existing response:', err);
            } finally {
                setCheckingExisting(false);
            }
        };

        checkExistingResponse();
    }, [params.id, searchParams]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (rating === 0) {
            setError('Please select a rating before submitting.');
            return;
        }

        setLoading(true);

        try {
            const customerId = searchParams.get('cid');
            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: params.id,
                    customerId,
                    content,
                    rating,
                    customer_name: name,
                    company
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit testimonial');

            setIsSubmitted(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                padding: '1.5rem'
            }}>
                <div style={{
                    maxWidth: '500px',
                    width: '100%',
                    background: 'white',
                    padding: '3rem',
                    borderRadius: '24px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }} className="animate-fade-in">
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem'
                    }}>
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#09090b', marginBottom: '1rem' }}>Thank You!</h1>
                    <p style={{ color: '#71717a', fontSize: '1.125rem', lineHeight: '1.6', margin: '0' }}>
                        Your feedback has been submitted to <strong>{productName}</strong>. We appreciate your feedback!
                    </p>
                </div>
            </div>
        );
    }

    if (checkingExisting) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <Loader2 size={32} className="animate-spin" color="var(--primary)" />
            </div>
        );
    }

    if (alreadyResponded) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                padding: '1.5rem'
            }}>
                <div style={{
                    maxWidth: '520px',
                    width: '100%',
                    background: 'white',
                    padding: '2.5rem',
                    borderRadius: '20px',
                    boxShadow: 'var(--shadow-lg)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#2563eb',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <CheckCircle2 size={36} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#09090b', margin: '0 0 0.75rem 0' }}>You&apos;ve already responded</h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.7', margin: 0 }}>
                        We have already received your feedback for <strong>{productName}</strong>. Thank you for taking the time to share it.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>

            <main style={{
                maxWidth: '600px',
                width: '100%',
                background: 'white',
                padding: '2.5rem',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#09090b', margin: '0 0 0.5rem 0' }}>Share your experience with {productName}</h1>
                    <p style={{ color: '#71717a', fontSize: '1rem' }}>Tell us how our product has helped you. We&apos;d love to hear it!</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {error && (
                        <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#dc2626', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#09090b' }}>Rating</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }} onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Star
                                        size={32}
                                        color={star <= (hoverRating || rating) ? '#fbbf24' : '#e4e4e7'}
                                        fill={star <= (hoverRating || rating) ? '#fbbf24' : 'transparent'}
                                        style={{ 
                                            transition: 'all 0.2s',
                                            transform: star <= hoverRating ? 'scale(1.1)' : 'scale(1)'
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#09090b' }}>Your Feedback</label>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                required
                                placeholder="I've been using this for a month now and..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="input"
                                style={{
                                    width: '100%',
                                    minHeight: '130px',
                                    resize: 'vertical',
                                    paddingBottom: '2.5rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#09090b' }}>Full Name</label>
                            <input
                                required
                                type="text"
                                placeholder="Jane Doe"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#09090b' }}>Company / Role</label>
                            <input
                                type="text"
                                placeholder="CEO @ Startup"
                                className="input"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '1rem', marginTop: '1rem' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <Send size={18} /> Submit Testimonial
                            </>
                        )}
                    </button>

                    {ownerPlan.toLowerCase() === 'free' && (
                        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#71717a', margin: 0 }}>
                            Powered by <strong>Testio</strong>
                        </p>
                    )}
                </form>
            </main>
        </div>
    );
}
