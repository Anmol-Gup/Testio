'use client';

import { Check, Zap, Clock, Info, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Simple Toast Component
const Toast = ({ message, type = 'success', onHide }: { message: string, type?: 'success' | 'error', onHide: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onHide, 3000);
        return () => clearTimeout(timer);
    }, [onHide]);

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: type === 'success' ? '#09090b' : '#ef4444',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out'
        }}>
            <CheckCircle2 size={18} color={type === 'success' ? '#10b981' : '#fff'} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{message}</span>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default function BillingPage() {
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [currentPlan, setCurrentPlan] = useState('Free');
    const [usage, setUsage] = useState(0); // Emails
    const [productsCount, setProductsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<{
        hasCustomer: boolean;
        hasAnySubscription: boolean;
        isActive: boolean;
        cancelAtPeriodEnd: boolean;
        currentPeriodEnd: string | null;
        status: string | null;
    } | null>(null);
    const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);

    const getPlanLimits = (plan: string) => {
        const p = plan.toLowerCase();
        if (p === 'pro') return { emails: 1000, products: 100, testimonials: 500, widgets: 100 };
        if (p === 'starter') return { emails: 200, products: 3, testimonials: 50, widgets: 3 };
        return { emails: 10, products: 1, testimonials: 10, widgets: 1 };
    };

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch plan and stripe id from database
            const { data: dbUser } = await supabase.from('users').select('plan, stripe_customer_id').eq('id', user.id).single();
            const plan = dbUser?.plan || user.user_metadata?.plan || 'Free';
            setCurrentPlan(plan);
            // Fetch real Stripe subscription state (not just whether a customer id exists)
            setIsSubscriptionLoading(true);
            try {
                const subRes = await fetch('/api/stripe/subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id }),
                });
                const subData = await subRes.json();
                if (!subData?.error) {
                    setSubscriptionStatus(subData);
                }
            } finally {
                setIsSubscriptionLoading(false);
            }

            // Fetch usage (emails)
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);

            const { count: emailCount } = await supabase
                .from('customers')
                .select('id, products!inner(user_id)', { count: 'exact', head: true })
                .eq('products.user_id', user.id)
                .gte('created_at', firstDayOfMonth.toISOString());

            setUsage(emailCount || 0);

            // Fetch products count
            const { count: pCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            setProductsCount(pCount || 0);

            setLoading(false);

            // Handle Stripe redirect returns
            const params = new URLSearchParams(window.location.search);
            if (params.get('success') === 'true') {
                const planFromUrl = params.get('plan') || '';
                const sessionId = params.get('session_id') || '';

                let upgradeVerified = !!(planFromUrl && sessionId);

                if (planFromUrl && sessionId) {
                    // Verify the Stripe checkout session before mutating the DB.
                    // This avoids a mismatch where `plan` is updated but no subscription exists.
                    const verifyRes = await fetch('/api/stripe/verify-checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId, userId: user.id }),
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData?.error) {
                        setToast({ message: verifyData.error, type: 'error' });
                        upgradeVerified = false;
                    } else {
                        setCurrentPlan(verifyData.plan);
                        // Refresh subscription state for the new customer/subscription.
                        setIsSubscriptionLoading(true);
                        try {
                            const subRes = await fetch('/api/stripe/subscription', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: user.id }),
                            });
                            const subData = await subRes.json();
                            if (subData?.error) {
                                setToast({ message: `Stripe status error: ${subData.error}`, type: 'error' });
                            } else {
                                setSubscriptionStatus(subData);
                            }
                        } finally {
                            setIsSubscriptionLoading(false);
                        }
                    }
                }

                if (upgradeVerified) setToast({ message: `🎉 Successfully upgraded to ${planFromUrl} plan!`, type: 'success' });
                // Clean up URL
                window.history.replaceState({}, '', '/billing');
            } else if (params.get('canceled') === 'true') {
                const source = params.get('source');

                if (source === 'portal') {
                    // Refresh subscription state after returning from Stripe.
                    setIsSubscriptionLoading(true);
                    try {
                        const subRes = await fetch('/api/stripe/subscription', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id }),
                        });
                        const subData = await subRes.json();
                        if (subData?.error) {
                            setToast({ message: `Stripe status error: ${subData.error}`, type: 'error' });
                        } else {
                            setSubscriptionStatus(subData);
                            if (subData.cancelAtPeriodEnd && subData.currentPeriodEnd) {
                                const endDate = new Date(subData.currentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                                setToast({ message: `Cancellation scheduled. You'll keep access until ${endDate}.`, type: 'success' });
                            } else {
                                setToast({ message: 'Subscription updated successfully.', type: 'success' });
                            }
                        }
                    } finally {
                        setIsSubscriptionLoading(false);
                    }
                } else {
                    setToast({ message: 'Payment was canceled.', type: 'error' });
                }

                window.history.replaceState({}, '', '/billing');
            }
        };
        fetchData();
    }, []);

    const handleUpgrade = async (planName: string) => {
        setIsUpgrading(planName);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: planName,
                    userId: user.id,
                    email: user.email,
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Redirect to Stripe hosted checkout
            window.location.href = data.url;
        } catch (error: unknown) {
            setToast({ message: error instanceof Error ? error.message : 'Unknown error', type: 'error' });
            setIsUpgrading(null);
        }
    };

    const handleManageSubscription = async (action: 'cancel' | 'manage' = 'cancel') => {
        setIsPortalLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, action }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            window.location.href = data.url;
        } catch (error: unknown) {
            setToast({ message: error instanceof Error ? error.message : 'Unknown error', type: 'error' });
        } finally {
            setIsPortalLoading(false);
        }
    };

    const plans = [
        {
            name: 'Free',
            price: '$0',
            description: 'Attract indie founders & validate.',
            features: [
                '1 Product',
                '10 emails request / month',
                'Fixed 3-day automation',
                '1 reminder (3 days later)',
                'Manual share link',
                'Basic dashboard stats'
            ],
            buttonText: 'Get Started',
        },
        {
            name: 'Starter',
            price: '$19',
            period: '/month',
            description: 'For growing SaaS products.',
            features: [
                'Everything in Free',
                'Up to 3 Products',
                '200 email requests / month',
                'Remove Testio branding',
                'No CSV export'
            ],
            buttonText: 'Upgrade to Starter',
            isPopular: true
        },
        {
            name: 'Pro',
            price: '$39',
            period: '/month',
            description: 'Scaling with social proof.',
            features: [
                'Everything in Starter',
                'Unlimited Products',
                '1,000 emails requests / month',
                'CSV export / Approved list',
                'Priority email support'
            ],
            buttonText: 'Upgrade to Pro'
        }
    ];

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1100px', position: 'relative' }}>
            {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>Billing & Plans</h1>
                <p style={{ margin: '0.25rem 0 0', color: '#71717a' }}>Manage your subscription and monitor usage limits.</p>
            </header>

            <div className="card" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>Current Usage</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#71717a' }}>
                        You’re on the <span style={{ background: '#f4f4f5', padding: '2px 8px', borderRadius: '12px', color: '#09090b', fontWeight: 700, fontSize: '0.75rem' }}>{currentPlan}</span> plan
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.25rem'
                }}>
                    {[
                        { label: 'Products Created', count: productsCount, limit: getPlanLimits(currentPlan).products },
                        { label: 'Emails This Month', count: usage, limit: getPlanLimits(currentPlan).emails },
                    ].map((item, idx) => {
                        const isLimitReached = item.count >= item.limit;
                        return (
                            <div key={idx} style={{
                                padding: '1.5rem',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                background: 'white'
                            }}>
                                <div style={{ fontSize: '0.8125rem', color: '#71717a', fontWeight: 600 }}>{item.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#09090b' }}>
                                    {item.count} <span style={{ color: '#71717a', fontSize: '1rem', fontWeight: 500 }}>/ {item.limit}</span>
                                </div>
                                {isLimitReached && (
                                    <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertCircle size={12} /> Limit reached
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="card" style={{
                marginBottom: '3rem',
                background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)',
                color: 'white',
                border: 'none',
                padding: '2.5rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1).toLowerCase()} Plan
                        </div>
                        <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: '0.25rem', fontWeight: 500 }}>
                            {usage}/{getPlanLimits(currentPlan).emails} emails used this month
                        </div>
                        <div style={{ fontSize: '0.8125rem', opacity: 0.75, marginTop: '0.25rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Clock size={14} /> Resets on {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{
                            width: '240px',
                            height: '8px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            marginTop: '1.25rem',
                            overflow: 'hidden',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <div style={{
                                width: `${Math.min((usage / getPlanLimits(currentPlan).emails) * 100, 100)}%`,
                                height: '100%',
                                background: usage >= getPlanLimits(currentPlan).emails ? '#f87171' : 'white',
                                boxShadow: usage >= getPlanLimits(currentPlan).emails ? '0 0 12px rgba(248, 113, 113, 0.6)' : '0 0 12px rgba(255, 255, 255, 0.6)',
                                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                            }} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage Status</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>
                            {currentPlan.toLowerCase() === 'free'
                                ? 'Free'
                                : (isSubscriptionLoading
                                    ? 'Checking'
                                    : (subscriptionStatus?.isActive
                                        ? (subscriptionStatus.cancelAtPeriodEnd ? 'Cancel scheduled' : 'Active')
                                        : 'Inactive'))}
                        </div>
                        {currentPlan.toLowerCase() !== 'free' && (
                            isSubscriptionLoading ? (
                                <button
                                    disabled
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'not-allowed',
                                        backdropFilter: 'blur(4px)',
                                        transition: 'all 0.2s',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                    title="Checking subscription status..."
                                >
                                    <Loader2 size={16} className="animate-spin" /> Checking...
                                </button>
                            ) : subscriptionStatus?.isActive ? (
                                <>
                                    <button
                                    onClick={() => handleManageSubscription(subscriptionStatus?.cancelAtPeriodEnd ? 'manage' : 'cancel')}
                                    disabled={isPortalLoading}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: isPortalLoading ? 'not-allowed' : 'pointer',
                                        backdropFilter: 'blur(4px)',
                                        transition: 'all 0.2s'
                                    }}
                                    title={subscriptionStatus.cancelAtPeriodEnd && subscriptionStatus.currentPeriodEnd
                                        ? `Cancellation scheduled. Access ends on ${new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}.`
                                        : 'Manage your subscription.'}
                                    onMouseOver={(e) => {
                                        if (!isPortalLoading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isPortalLoading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                    }}
                                >
                                    {isPortalLoading ? <Loader2 size={16} className="animate-spin" /> : (subscriptionStatus.cancelAtPeriodEnd ? 'Manage Subscription' : 'Cancel Subscription')}
                                </button>
                                {subscriptionStatus.cancelAtPeriodEnd && subscriptionStatus.currentPeriodEnd && (
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.9, fontWeight: 600 }}>
                                        Cancels on {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                )}
                            </>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(currentPlan)}
                                    disabled={isUpgrading === currentPlan}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: isUpgrading === currentPlan ? 'not-allowed' : 'pointer',
                                        backdropFilter: 'blur(4px)',
                                        transition: 'all 0.2s'
                                    }}
                                    title="No active Stripe subscription found. Click to subscribe again."
                                    onMouseOver={(e) => {
                                        if (isUpgrading !== currentPlan) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        if (isUpgrading !== currentPlan) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                    }}
                                >
                                    {isUpgrading === currentPlan ? <Loader2 size={16} className="animate-spin" /> : 'Resubscribe'}
                                </button>
                            )
                        )}
</div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
                marginBottom: '4rem'
            }}>
                {plans.map((plan, i) => {
                    const isCurrent = plan.name.toLowerCase() === currentPlan.toLowerCase();
                    return (
                        <div key={i} className="card" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2rem',
                            position: 'relative',
                            borderColor: isCurrent ? 'var(--primary)' : plan.isPopular ? 'var(--primary)' : 'var(--border)',
                            borderWidth: (plan.isPopular || isCurrent) ? '2px' : '1px',
                            transform: plan.isPopular ? 'scale(1.02)' : 'none',
                            zIndex: plan.isPopular ? 1 : 0,
                            background: isCurrent ? 'rgba(139, 92, 246, 0.02)' : 'white'
                        }}>
                            {plan.isPopular && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-14px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '4px 16px',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>Most Popular</div>
                            )}
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{plan.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#09090b' }}>{plan.price}</span>
                                    {plan.period && <span style={{ color: 'var(--secondary)', fontSize: '1rem' }}>{plan.period}</span>}
                                </div>
                                <p style={{ margin: '0.75rem 0 0', fontSize: '0.9375rem', color: 'var(--secondary)' }}>{plan.description}</p>
                            </div>

                            <div style={{ flex: 1 }}>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {plan.features.map((feature, j) => (
                                        <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9375rem' }}>
                                            <Check size={18} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
                                            <span style={{ color: 'var(--foreground)' }}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                                style={{ 
                                    width: '100%', 
                                    padding: '1rem',
                                    cursor: isCurrent ? 'default' : 'pointer'
                                }}
                                disabled={isCurrent || isUpgrading === plan.name}
                                onClick={() => !isCurrent && handleUpgrade(plan.name)}
                            >
                                {isUpgrading === plan.name ? <Loader2 size={18} className="animate-spin" /> : (isCurrent ? 'Current Plan' : (
                                    <>
                                        {plan.name !== 'Free' && <Zap size={18} fill="currentColor" />} {plan.buttonText}
                                    </>
                                ))}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="card" style={{ background: 'var(--input)', border: '1px dashed var(--border)', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.75rem', background: 'white', borderRadius: '12px', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
                    <Info size={24} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>About Automation Timing</h3>
                    <p style={{ fontSize: '0.9375rem', margin: 0, maxWidth: '800px' }}>
                        Testio rewards your customers for sticking around. Our automation timing is <strong>fixed for all plans</strong> (3-day initial request + 1 reminder 3 days later) as our data shows this converts 40% better than immediate requests.
                    </p>
                </div>
            </div>
        </div>
    );
}
