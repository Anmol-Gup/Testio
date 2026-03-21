'use client';

import { Plus, Users, Mail, MessageSquare, Check, X, Copy, Code, ExternalLink, CheckCircle2, AlertCircle, Loader2, Trash2, Download, ChevronRight, Zap, Star, LayoutGrid, List, Columns, ChevronDown, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_SETTINGS = {
    layout: 'grid',
    theme: 'light',
    maxTestimonials: 10,
    showStars: true,
    showCompany: true,
    backgroundColor: 'transparent',
    gradient: 'none',
    bgImageUrl: '',
    width: 'auto',
    height: 'auto',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#e5e7eb',
    padding: 24,
    cardGap: 16,
    maxWidth: 0,
    horizontalAlign: 'center',
    containerShadow: 'none',
    cardBgColor: 'default',
    cardTextColor: 'default',
    cardBorderRadius: 12,
    cardShadow: 'small',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
    animationType: 'none',
};

const GRADIENTS = [
    'none',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    'linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
];

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
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '8px',
            maxWidth: '380px',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out'
        }}>
            <CheckCircle2 size={18} color={type === 'success' ? '#10b981' : '#fff'} />
            <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'pre-line', textAlign: 'center', lineHeight: '1.5' }}>{message}</span>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const PAGE_SIZE = 5;

export default function ProductDetailPage({ params }: { params: { id: string } }) {
    const [product, setProduct] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Pagination states
    const [hasMoreCustomers, setHasMoreCustomers] = useState(false);
    const [hasMoreTestimonials, setHasMoreTestimonials] = useState(false);
    const [loadingMoreCustomers, setLoadingMoreCustomers] = useState(false);
    const [loadingMoreTestimonials, setLoadingMoreTestimonials] = useState(false);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userPlan, setUserPlan] = useState('');
    const [monthlyUsage, setMonthlyUsage] = useState(0);
    const [sendImmediately, setSendImmediately] = useState(true);
    const [activeTab, setActiveTab] = useState<'automation' | 'widget'>('automation');
    const [viewingTestimonial, setViewingTestimonial] = useState<any>(null);

    // Widget settings states
    const [widgetSettings, setWidgetSettings] = useState(DEFAULT_SETTINGS);
    const [activeAccordion, setActiveAccordion] = useState<string | null>('background-border');
    const [isSavingWidget, setIsSavingWidget] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Product
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: prod, error: prodErr } = await supabase
                .from('products')
                .select('*')
                .eq('id', params.id)
                .eq('user_id', user.id)
                .single();
            if (prodErr) throw prodErr;

            // Fetch metrics
            const { count: upgraderCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('product_id', params.id);

            const { count: sentCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('product_id', params.id)
                .neq('status', 'scheduled');

            const { count: totalResponses } = await supabase
                .from('testimonials')
                .select('*', { count: 'exact', head: true })
                .eq('product_id', params.id);

            const convRate = upgraderCount && upgraderCount > 0
                ? Math.round(((totalResponses || 0) / upgraderCount) * 100)
                : 0;

            setProduct({
                ...prod,
                upgrades: upgraderCount || 0,
                emails_sent: sentCount || 0,
                responses: totalResponses || 0,
                conversion_rate: convRate
            });

            if (prod.widget_settings && typeof prod.widget_settings === 'object' && Object.keys(prod.widget_settings).length > 0) {
                setWidgetSettings({ ...DEFAULT_SETTINGS, ...prod.widget_settings });
            }

            // 2. Fetch Initial Customers (Strictly 5)
            const { data: custs, error: custErr } = await supabase
                .from('customers')
                .select('*')
                .eq('product_id', params.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (custErr) throw custErr;
            setCustomers(custs || []);
            setHasMoreCustomers(false);

            // 3. Fetch Initial Testimonials (Strictly 5)
            const { data: tests, error: testErr } = await supabase
                .from('testimonials')
                .select('*')
                .eq('product_id', params.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (testErr) throw testErr;
            setTestimonials(tests || []);
            setHasMoreTestimonials(false);

        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    const fetchUsage = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase.from('users').select('plan').eq('id', user.id).single();
        setUserPlan(userData?.plan || 'Free');

        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        // Count all customers created this month by this user across all products
        // We need to join with products to filter by user_id
        const { count, error } = await supabase
            .from('customers')
            .select('id, products!inner(user_id)', { count: 'exact', head: true })
            .eq('products.user_id', user.id)
            .gte('created_at', firstDayOfMonth.toISOString());

        if (!error) {
            setMonthlyUsage(count || 0);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchUsage();
    }, [fetchData, fetchUsage]);

    const loadMoreCustomers = async () => {
        if (loadingMoreCustomers || !hasMoreCustomers) return;
        setLoadingMoreCustomers(true);
        try {
            const lastCust = customers[customers.length - 1];
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('product_id', params.id)
                .lt('created_at', lastCust.created_at)
                .order('created_at', { ascending: false })
                .limit(PAGE_SIZE + 1);

            if (error) throw error;

            if (data.length > PAGE_SIZE) {
                setHasMoreCustomers(true);
                setCustomers([...customers, ...data.slice(0, PAGE_SIZE)]);
            } else {
                setHasMoreCustomers(false);
                setCustomers([...customers, ...data]);
            }
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoadingMoreCustomers(false);
        }
    };

    const loadMoreTestimonials = async () => {
        if (loadingMoreTestimonials || !hasMoreTestimonials) return;
        setLoadingMoreTestimonials(true);
        try {
            const lastTest = testimonials[testimonials.length - 1];
            const { data, error } = await supabase
                .from('testimonials')
                .select('*')
                .eq('product_id', params.id)
                .lt('created_at', lastTest.created_at)
                .order('created_at', { ascending: false })
                .limit(PAGE_SIZE + 1);

            if (error) throw error;

            if (data.length > PAGE_SIZE) {
                setHasMoreTestimonials(true);
                setTestimonials([...testimonials, ...data.slice(0, PAGE_SIZE)]);
            } else {
                setHasMoreTestimonials(false);
                setTestimonials([...testimonials, ...data]);
            }
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoadingMoreTestimonials(false);
        }
    };

    const handleExportCSV = () => {
        if (userPlan !== 'Pro' && userPlan !== 'Starter') {
            alert('CSV Export is only available on the Starter and Pro plans. Please upgrade to export your data.');
            return;
        }
        if (customers.length === 0) return;
        const headers = ["Email", "Status", "Joined At"];
        const rows = customers.map(c => [c.email, c.status, new Date(c.created_at).toLocaleDateString()]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${product?.name?.replace(/\s+/g, '_') || 'product'}_customers.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ message: 'CSV exported successfully', type: 'success' });
    };

    const handleDeleteCustomer = async (id: string) => {
        if (!confirm('Remove this customer from automation?')) return;
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw error;
            setCustomers(customers.filter(c => c.id !== id));
            setToast({ message: 'Customer removed', type: 'success' });
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    };

    const handleDeleteTestimonial = async (id: string) => {
        if (!confirm('Delete this testimonial permanently?')) return;
        try {
            const { error } = await supabase.from('testimonials').delete().eq('id', id);
            if (error) throw error;
            setTestimonials(testimonials.filter(t => t.id !== id));
            setToast({ message: 'Testimonial deleted', type: 'success' });
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    };

    const handleUpdateTestimonial = async (id: string, approved: boolean) => {
        try {
            const newStatus = approved ? 'approved' : 'pending';
            const { error } = await supabase
                .from('testimonials')
                .update({ 
                    status: newStatus
                })
                .eq('id', id);
            if (error) throw error;
            setTestimonials(testimonials.map(t => t.id === id ? { ...t, status: newStatus } : t));
            setToast({ message: approved ? 'Testimonial approved!' : 'Testimonial unapproved', type: 'success' });
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    };


    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check plan limits
        const plan = userPlan.toLowerCase();
        const emailLimit = plan === 'starter' ? 200 : plan === 'pro' ? 1000 : 10;
        if (monthlyUsage >= emailLimit) {
            setToast({
                message: `You've reached your monthly limit of ${emailLimit} email requests on the ${userPlan} plan. Please upgrade for more.`,
                type: 'error'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const normalizedEmail = customerEmail.trim().toLowerCase();
            if (!normalizedEmail) {
                throw new Error('Please enter a valid email');
            }

            const { data: existingCustomer, error: existingErr } = await supabase
                .from('customers')
                .select('id')
                .eq('product_id', params.id)
                .ilike('email', normalizedEmail)
                .maybeSingle();
            if (existingErr) throw existingErr;
            if (existingCustomer) {
                throw new Error('This customer already exists for this product.');
            }

            const { data, error } = await supabase
                .from('customers')
                .insert([{
                    product_id: params.id,
                    email: normalizedEmail,
                    status: sendImmediately ? 'initial_sent' : 'scheduled'
                }])
                .select()
                .single();
            if (error) throw error;

            if (sendImmediately) {
                const res = await fetch('/api/customers/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerId: data.id,
                        productId: params.id,
                        productName: product.name,
                        productSlug: product.slug
                    })
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to send immediate email');
                }
            }

            setCustomers([data, ...customers].slice(0, 5));
            setProduct((prev: any) => {
                if (!prev) return prev;
                const nextUpgrades = (prev.upgrades || 0) + 1;
                const nextEmailsSent = (prev.emails_sent || 0) + (sendImmediately ? 1 : 0);
                const nextResponses = prev.responses || 0;
                const nextConversionRate = nextUpgrades > 0
                    ? Math.round((nextResponses / nextUpgrades) * 100)
                    : 0;

                return {
                    ...prev,
                    upgrades: nextUpgrades,
                    emails_sent: nextEmailsSent,
                    conversion_rate: nextConversionRate,
                };
            });
            setIsAddModalOpen(false);
            setCustomerEmail('');
            setSendImmediately(true);
            setMonthlyUsage(prev => prev + 1);

            // Calculate scheduled date (3 days from now)
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + 3);
            const formattedDate = scheduledDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            const formattedTime = scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

            setToast({
                message: sendImmediately 
                    ? `Customer added successfully.\nTestimonial email has been sent.` 
                    : `Customer added successfully.\nTestimonial email will be sent on:\n${formattedDate} at ${formattedTime}`,
                type: 'success'
            });
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setToast({ message: `${type} copied to clipboard!`, type: 'success' });
    };

    const handleSaveWidget = async () => {
        setIsSavingWidget(true);
        try {
            const { error } = await supabase
                .from('products')
                .update({ widget_settings: widgetSettings })
                .eq('id', params.id);

            if (error) throw error;
            setToast({ message: 'Widget settings saved successfully!', type: 'success' });
        } catch (error: any) {
            setToast({ message: `Failed to save widget: ${error.message}`, type: 'error' });
        } finally {
            setIsSavingWidget(false);
        }
    };

    const toggleAccordion = (name: string) => {
        setActiveAccordion(activeAccordion === name ? null : name);
    };

    if (loading) return (
        <div className="page-loader">
            <Loader2 size={32} className="animate-spin" color="var(--primary)" />
            <span className="page-loader-text">Loading product...</span>
        </div>
    );

    if (!product) return (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: 380, margin: '3rem auto' }}>
            <AlertCircle size={32} color="#ef4444" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#09090b', margin: '0 0 0.5rem' }}>Product not found</p>
            <p style={{ fontSize: '0.875rem', color: '#71717a', margin: '0 0 1.5rem' }}>This product doesn't exist or you don't have access.</p>
            <Link href="/products" className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>← Back to Products</Link>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ position: 'relative' }}>
            {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem', color: '#71717a', fontWeight: 600 }}>
                ← Back to Products
            </Link>

            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em' }}>{product.name}</h1>
                    <a href={product.website_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#71717a', fontSize: '1rem', marginTop: '0.4rem', fontWeight: 500 }}>
                        {product.website_url.replace('https://', '')} <ExternalLink size={14} />
                    </a>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
                        <Plus size={18} /> Add Customer
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                <button 
                    onClick={() => setActiveTab('automation')}
                    style={{ 
                        padding: '0.75rem 0.5rem', 
                        fontSize: '0.9375rem', 
                        fontWeight: 600, 
                        color: activeTab === 'automation' ? 'var(--primary)' : '#71717a',
                        borderBottom: activeTab === 'automation' ? '2px solid var(--primary)' : '2px solid transparent',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '-1px'
                    }}
                >
                    Automation
                </button>
                <button 
                    onClick={() => setActiveTab('widget')}
                    style={{ 
                        padding: '0.75rem 0.5rem', 
                        fontSize: '0.9375rem', 
                        fontWeight: 600, 
                        color: activeTab === 'widget' ? 'var(--primary)' : '#71717a',
                        borderBottom: activeTab === 'widget' ? '2px solid var(--primary)' : '2px solid transparent',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '-1px'
                    }}
                >
                    Widget
                </button>
            </div>

            {activeTab === 'automation' ? (
                <>
                    {/* Metrics */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '2rem'
                    }}>
                        {[
                            { label: 'Customers', value: product.upgrades || 0, color: 'var(--primary)' },
                            { label: 'Requests Sent', value: product.emails_sent || 0, color: '#8b5cf6' },
                            { label: 'Responses', value: product.responses || 0, color: '#ec4899' },
                            { label: 'Conv. Rate', value: product.conversion_rate ? `${product.conversion_rate}%` : '0%', color: '#10b981' },
                        ].map((stat, i) => (
                            <div key={i} className="card" style={{ padding: '1rem 1.5rem' }}>
                                <div style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: 800, letterSpacing: '0.05em' }}>{stat.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#09090b' }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
                {/* Customer List */}
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column', maxHeight: '620px' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#09090b' }}>Automation Queue</h3>
                        <button
                            onClick={handleExportCSV}
                            className="btn btn-secondary"
                            style={{
                                padding: '0.5rem 1rem',
                                height: '36px',
                                fontSize: '0.8125rem',
                                opacity: ['pro', 'starter'].includes(userPlan.toLowerCase()) ? 1 : 0.6,
                                cursor: ['pro', 'starter'].includes(userPlan.toLowerCase()) ? 'pointer' : 'not-allowed',
                                gap: '0.5rem'
                            }}
                            title={['pro', 'starter'].includes(userPlan.toLowerCase()) ? 'Export CSV' : 'Upgrade to Starter or Pro to Export'}
                        >
                            {['pro', 'starter'].includes(userPlan.toLowerCase()) ? <Download size={14} /> : <Zap size={14} color="var(--primary)" />}
                            Export CSV
                        </button>
                    </div>
                    <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {customers.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#71717a', padding: '2rem' }}>No customers in queue.</p>
                            ) : customers.map((customer) => (
                                <div key={customer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--input)', borderRadius: '12px', boxShadow: 'inset 0 0 0 1px var(--border)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#09090b' }}>{customer.email}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            background: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontWeight: 700,
                                            color: customer.status === 'responded' ? 'var(--success)' : '#71717a'
                                        }}>{customer.status}</span>
                                        <button onClick={() => handleDeleteCustomer(customer.id)} style={{ color: '#ef4444', opacity: 0.5 }} className="hover:opacity-100">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {hasMoreCustomers && (
                            <button onClick={loadMoreCustomers} disabled={loadingMoreCustomers} className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem', fontSize: '0.875rem' }}>
                                {loadingMoreCustomers ? <Loader2 size={16} className="animate-spin" /> : 'Load More Customers'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Testimonials Review */}
                <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '620px' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#09090b' }}>Latest Testimonials</h3>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: 'var(--input)' }}>
                                    <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#71717a', fontWeight: 800 }}>Customer</th>
                                    <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#71717a', fontWeight: 800 }}>Feedback</th>
                                    <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#71717a', fontWeight: 800 }}>Status</th>
                                    <th style={{ padding: '1rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#71717a', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testimonials.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>No testimonials yet.</td></tr>
                                ) : testimonials.map((t) => {
                                    const isApproved = t.status === 'approved';
                                    return (
                                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1.25rem 2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                                                        {(t.customer_name?.[0] || 'A').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#09090b', lineHeight: 1.2 }}>{t.customer_name || 'Anonymous'}</div>
                                                        <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={8} color={i < (t.rating || 5) ? '#fbbf24' : '#e4e4e7'} fill={i < (t.rating || 5) ? '#fbbf24' : 'transparent'} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem' }}>
                                                <p style={{
                                                    fontSize: '0.875rem',
                                                    color: '#374151',
                                                    margin: 0,
                                                    maxWidth: '300px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    fontStyle: 'italic'
                                                }}>"{t.content}"</p>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem' }}>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    background: isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: isApproved ? 'var(--success)' : 'var(--warning)',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    height: '22px'
                                                }}>{t.status}</span>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => setViewingTestimonial(t)}
                                                        style={{ color: '#09090b', padding: '0.4rem', borderRadius: '8px', background: 'transparent' }}
                                                        title="View Full Testimonial"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateTestimonial(t.id, !isApproved)}
                                                        style={{ color: isApproved ? 'var(--warning)' : 'var(--success)', padding: '0.4rem', borderRadius: '8px', background: 'transparent' }}
                                                        title={isApproved ? 'Unapprove' : 'Approve'}
                                                    >
                                                        {isApproved ? <X size={18} /> : <Check size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTestimonial(t.id)}
                                                        style={{ color: '#ef4444', padding: '0.4rem', borderRadius: '8px', background: 'transparent' }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {hasMoreTestimonials && (
                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                            <button onClick={loadMoreTestimonials} disabled={loadingMoreTestimonials} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>
                                {loadingMoreTestimonials ? <Loader2 size={16} className="animate-spin" /> : 'Load More Testimonials'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
                </>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
                    {/* Left Panel: Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Widget Customs</h3>
                                <button 
                                    onClick={handleSaveWidget} 
                                    className="btn btn-primary" 
                                    disabled={isSavingWidget}
                                    style={{ height: '36px', padding: '0 1rem', fontSize: '0.8125rem' }}
                                >
                                    {isSavingWidget ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>

                            {/* 1. Layout Selection */}
                            <section>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Layout</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                    {[
                                        { id: 'grid', label: 'Grid', icon: LayoutGrid },
                                        { id: 'list', label: 'List', icon: List },
                                        { id: 'carousel', label: 'Carousel', icon: MessageSquare },
                                        { id: 'masonry', label: 'Masonry', icon: Columns }
                                    ].map(item => (
                                        <button 
                                            key={item.id}
                                            onClick={() => setWidgetSettings({...widgetSettings, layout: item.id})}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem',
                                                borderRadius: '10px',
                                                border: widgetSettings.layout === item.id ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                                                background: widgetSettings.layout === item.id ? '#f5f3ff' : '#fff',
                                                color: widgetSettings.layout === item.id ? 'var(--primary)' : '#64748b',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <item.icon size={16} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* 2. Theme & Options */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <section>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Theme</label>
                                    <select 
                                        className="input" 
                                        value={widgetSettings.theme}
                                        onChange={(e) => setWidgetSettings({...widgetSettings, theme: e.target.value})}
                                        style={{ height: '36px', fontSize: '0.8125rem', padding: '0 0.75rem' }}
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                    </select>
                                </section>
                                <section>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem' }}>Max</label>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        value={widgetSettings.maxTestimonials}
                                        onChange={(e) => setWidgetSettings({...widgetSettings, maxTestimonials: parseInt(e.target.value)})}
                                        style={{ height: '36px', fontSize: '0.8125rem', padding: '0 0.75rem' }}
                                    />
                                </section>
                            </div>

                            {/* 3. Toggles */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                                {[
                                    { id: 'showStars', label: 'Stars' },
                                    { id: 'showCompany', label: 'Company' }
                                ].map(toggle => (
                                    <div key={toggle.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{toggle.label}</span>
                                        <button 
                                            onClick={() => setWidgetSettings({...widgetSettings, [toggle.id]: !widgetSettings[toggle.id as keyof typeof widgetSettings]})}
                                            style={{
                                                width: '36px',
                                                height: '20px',
                                                background: widgetSettings[toggle.id as keyof typeof widgetSettings] ? 'var(--primary)' : '#cbd5e1',
                                                borderRadius: '30px',
                                                position: 'relative',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '14px',
                                                height: '14px',
                                                background: 'white',
                                                borderRadius: '50%',
                                                position: 'absolute',
                                                top: '3px',
                                                left: widgetSettings[toggle.id as keyof typeof widgetSettings] ? '19px' : '3px',
                                                transition: 'all 0.2s'
                                            }} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Advanced Accordions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div 
                                        onClick={() => toggleAccordion('bg')}
                                        style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: activeAccordion === 'bg' ? '#fcfdff' : '#fff' }}
                                    >
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Background & Style</span>
                                        {activeAccordion === 'bg' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                    {activeAccordion === 'bg' && (
                                        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <section>
                                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Gradients</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                                                    {GRADIENTS.map((g, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={() => setWidgetSettings({...widgetSettings, gradient: g})}
                                                            style={{ 
                                                                height: '24px', 
                                                                borderRadius: '6px', 
                                                                background: g === 'none' ? '#f1f5f9' : g, 
                                                                border: widgetSettings.gradient === g ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                            <section>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Padding: {widgetSettings.padding}px</label>
                                                </div>
                                                <input type="range" min="0" max="60" className="slider" value={widgetSettings.padding} onChange={(e) => setWidgetSettings({...widgetSettings, padding: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                            </section>
                                        </div>
                                    )}
                                </div>

                                {/* Card Styling */}
                                <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div 
                                        onClick={() => toggleAccordion('card')}
                                        style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: activeAccordion === 'card' ? '#fcfdff' : '#fff' }}
                                    >
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Card Styling</span>
                                        {activeAccordion === 'card' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                    {activeAccordion === 'card' && (
                                        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <section>
                                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Card Background Color</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px' }}>
                                                    <input type="color" value={widgetSettings.cardBgColor === 'default' ? '#ffffff' : widgetSettings.cardBgColor} onChange={(e) => setWidgetSettings({...widgetSettings, cardBgColor: e.target.value})} style={{ width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                                                    <input type="text" value={widgetSettings.cardBgColor === 'default' ? '' : widgetSettings.cardBgColor} placeholder="Theme default" onChange={(e) => setWidgetSettings({...widgetSettings, cardBgColor: e.target.value || 'default'})} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.75rem', width: '100%' }} />
                                                </div>
                                            </section>
                                            <section>
                                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Card Text Color</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px' }}>
                                                    <input type="color" value={widgetSettings.cardTextColor === 'default' ? '#000000' : widgetSettings.cardTextColor} onChange={(e) => setWidgetSettings({...widgetSettings, cardTextColor: e.target.value})} style={{ width: '24px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                                                    <input type="text" value={widgetSettings.cardTextColor === 'default' ? '' : widgetSettings.cardTextColor} placeholder="Theme default" onChange={(e) => setWidgetSettings({...widgetSettings, cardTextColor: e.target.value || 'default'})} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.75rem', width: '100%' }} />
                                                </div>
                                            </section>
                                            <section>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Card Border Radius: {widgetSettings.cardBorderRadius}px</label>
                                                </div>
                                                <input type="range" min="0" max="32" className="slider" value={widgetSettings.cardBorderRadius} onChange={(e) => setWidgetSettings({...widgetSettings, cardBorderRadius: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                            </section>
                                            <section>
                                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Card Shadow</label>
                                                <select className="input" value={widgetSettings.cardShadow} onChange={(e) => setWidgetSettings({...widgetSettings, cardShadow: e.target.value})} style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.5rem' }}>
                                                    <option value="none">None</option>
                                                    <option value="small">Small</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="large">Large</option>
                                                </select>
                                            </section>
                                        </div>
                                    )}
                                </div>

                                <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div 
                                        onClick={() => toggleAccordion('typo')}
                                        style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: activeAccordion === 'typo' ? '#fcfdff' : '#fff' }}
                                    >
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Typography</span>
                                        {activeAccordion === 'typo' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                    {activeAccordion === 'typo' && (
                                        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <section>
                                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Font Family</label>
                                                <select className="input" value={widgetSettings.fontFamily} onChange={(e) => setWidgetSettings({...widgetSettings, fontFamily: e.target.value})} style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.5rem' }}>
                                                    <option value="inherit">Default (inherit)</option>
                                                    <option value="Inter, sans-serif">Inter</option>
                                                    <option value="Roboto, sans-serif">Roboto</option>
                                                    <option value="Outfit, sans-serif">Outfit</option>
                                                    <option value="Poppins, sans-serif">Poppins</option>
                                                </select>
                                            </section>
                                            <section>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                    <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>Font Size: {widgetSettings.fontSize}px</label>
                                                </div>
                                                <input type="range" min="12" max="24" className="slider" value={widgetSettings.fontSize} onChange={(e) => setWidgetSettings({...widgetSettings, fontSize: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                            </section>
                                            <section>
                                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Font Weight</label>
                                                <select className="input" value={widgetSettings.fontWeight} onChange={(e) => setWidgetSettings({...widgetSettings, fontWeight: e.target.value})} style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.5rem' }}>
                                                    <option value="400">Normal (400)</option>
                                                    <option value="500">Medium (500)</option>
                                                    <option value="600">Semibold (600)</option>
                                                    <option value="700">Bold (700)</option>
                                                </select>
                                            </section>
                                            <section>
                                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Text Alignment</label>
                                                <select className="input" value={widgetSettings.textAlign} onChange={(e) => setWidgetSettings({...widgetSettings, textAlign: e.target.value})} style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.5rem' }}>
                                                    <option value="left">Left</option>
                                                    <option value="center">Center</option>
                                                    <option value="right">Right</option>
                                                </select>
                                            </section>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Animation */}
                                <div style={{ border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div 
                                        onClick={() => toggleAccordion('animation')}
                                        style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: activeAccordion === 'animation' ? '#fcfdff' : '#fff' }}
                                    >
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>Animation</span>
                                        {activeAccordion === 'animation' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                    {activeAccordion === 'animation' && (
                                        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <section>
                                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>Animation Type</label>
                                                <select className="input" value={widgetSettings.animationType} onChange={(e) => setWidgetSettings({...widgetSettings, animationType: e.target.value})} style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.5rem' }}>
                                                    <option value="none">None</option>
                                                    <option value="fade-in">Fade In</option>
                                                    <option value="slide-up">Slide Up</option>
                                                    <option value="zoom-in">Zoom In</option>
                                                </select>
                                            </section>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Panel: Live Preview */}
                    <div style={{ position: 'sticky', top: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Live Preview</h3>
                            <Link href={`/widget-test/preview?id=${product.id}`} target="_blank" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                Fullscreen <ExternalLink size={12} />
                            </Link>
                        </div>
                        
                        <div style={{ 
                            background: widgetSettings.backgroundColor === 'transparent' ? '#f8fafc' : widgetSettings.backgroundColor,
                            backgroundImage: widgetSettings.gradient !== 'none' ? widgetSettings.gradient : 'none',
                            borderRadius: '24px', 
                            padding: `${widgetSettings.padding}px`,
                            minHeight: '500px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: widgetSettings.horizontalAlign === 'center' ? 'center' : (widgetSettings.horizontalAlign === 'right' ? 'flex-end' : 'flex-start'),
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                            overflow: 'hidden'
                        }}>
                             <div style={{ 
                                display: widgetSettings.layout === 'carousel' ? 'flex' : 'grid',
                                gridTemplateColumns: widgetSettings.layout === 'grid' ? `repeat(auto-fit, minmax(240px, 1fr))` : (widgetSettings.layout === 'carousel' ? 'none' : '1fr'),
                                flexDirection: widgetSettings.layout === 'carousel' ? 'row' : 'column',
                                overflowX: widgetSettings.layout === 'carousel' ? 'auto' : 'visible',
                                scrollSnapType: widgetSettings.layout === 'carousel' ? 'x mandatory' : 'none',
                                gap: `${widgetSettings.cardGap}px`,
                                width: '100%',
                                paddingBottom: widgetSettings.layout === 'carousel' ? '1rem' : '0',
                                zIndex: 1,
                                msOverflowStyle: 'none',
                                scrollbarWidth: 'none',
                                WebkitOverflowScrolling: 'touch'
                            }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ 
                                        background: widgetSettings.cardBgColor === 'default' ? (widgetSettings.theme === 'dark' ? '#1e293b' : '#ffffff') : widgetSettings.cardBgColor,
                                        color: widgetSettings.cardTextColor === 'default' ? (widgetSettings.theme === 'dark' ? '#f1f5f9' : '#334155') : widgetSettings.cardTextColor,
                                        padding: '1.25rem',
                                        borderRadius: `${widgetSettings.cardBorderRadius}px`,
                                        boxShadow: widgetSettings.cardShadow === 'none' ? 'none' : (widgetSettings.cardShadow === 'small' ? '0 1px 3px rgba(0,0,0,0.1)' : (widgetSettings.cardShadow === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' : '0 10px 15px rgba(0,0,0,0.1)')),
                                        border: '1px solid #e2e8f0',
                                        textAlign: widgetSettings.textAlign as any,
                                        fontFamily: widgetSettings.fontFamily,
                                        fontSize: `${widgetSettings.fontSize}px`,
                                        fontWeight: widgetSettings.fontWeight,
                                        transition: 'all 0.3s ease',
                                        flexShrink: widgetSettings.layout === 'carousel' ? 0 : 1,
                                        width: widgetSettings.layout === 'carousel' ? '280px' : 'auto',
                                        scrollSnapAlign: widgetSettings.layout === 'carousel' ? 'start' : 'none'
                                    }}>
                                        {widgetSettings.showStars && (
                                            <div style={{ display: 'flex', gap: '2px', marginBottom: '0.75rem', justifyContent: widgetSettings.textAlign === 'center' ? 'center' : (widgetSettings.textAlign === 'right' ? 'flex-end' : 'flex-start') }}>
                                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill="#fbbf24" color="#fbbf24" />)}
                                            </div>
                                        )}
                                        <p style={{ 
                                            color: widgetSettings.theme === 'dark' ? '#f1f5f9' : '#334155', 
                                            lineHeight: 1.6, 
                                            fontStyle: 'italic',
                                            marginBottom: '1rem'
                                        }}>&quot;Testio is the best thing that happened to our marketing team!&quot;</p>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem',
                                            flexDirection: (widgetSettings.textAlign === 'center' ? 'column' : 'row') as any,
                                            justifyContent: (widgetSettings.textAlign === 'center' ? 'center' : (widgetSettings.textAlign === 'right' ? 'flex-end' : 'flex-start')) as any
                                        }}>
                                            <div style={{ textAlign: (widgetSettings.textAlign === 'center' ? 'center' : 'left') as any }}>
                                                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: widgetSettings.theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Alex Rivera</div>
                                                {widgetSettings.showCompany && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Founder</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {userPlan.toLowerCase() === 'free' && (
                                <div style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center', width: '100%', opacity: 0.5 }}>
                                    <span style={{ fontSize: '0.625rem', fontWeight: 800, color: widgetSettings.theme === 'dark' ? '#94a3b8' : '#64748b', letterSpacing: '0.1em' }}>⚡ POWERED BY TESTIO</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                 <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 800 }}>Embed Code</h4>
                                 <div style={{ position: 'relative', flex: 1 }}>
                                    <pre style={{
                                        background: '#09090b',
                                        color: '#a3e635',
                                        padding: '1rem',
                                        borderRadius: '10px',
                                        fontSize: '0.75rem',
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                        margin: 0,
                                        height: '100%'
                                    }}>{`<div id="testio-widget"></div>\n<script src="${window.location.origin}/api/widget?id=${product.id}" defer></script>`}</pre>
                                    <button
                                        onClick={() => copyToClipboard(`<div id="testio-widget"></div>\n<script src="${window.location.origin}/api/widget?id=${product.id}" defer></script>`, 'Embed code')}
                                        style={{
                                            position: 'absolute',
                                            top: '0.5rem',
                                            right: '0.5rem',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '6px',
                                            fontSize: '0.65rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 800 }}>Direct Form Link</h4>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Send link to customers to collect testimonials.</p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                    <input 
                                        className="input" 
                                        readOnly 
                                        value={`${window.location.origin}/submit/${product.id}`}
                                        style={{ flex: 1, fontSize: '0.75rem', height: '36px' }}
                                    />
                                    <button 
                                        onClick={() => copyToClipboard(`${window.location.origin}/submit/${product.id}`, 'Form link')}
                                        className="btn btn-secondary"
                                        style={{ height: '36px', padding: '0 1rem', fontSize: '0.75rem' }}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .slider {
                    -webkit-appearance: none;
                    height: 4px;
                    background: #e2e8f0;
                    border-radius: 5px;
                    outline: none;
                }
                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    background: var(--primary);
                    cursor: pointer;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
            `}</style>

            {/* Add Customer Modal */}
            {isAddModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    backdropFilter: 'blur(4px)'
                }} onClick={() => !isSubmitting && setIsAddModalOpen(false)}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '420px',
                        boxShadow: 'var(--shadow-lg)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#09090b' }}>Add New Customer</h2>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ color: '#71717a' }} disabled={isSubmitting}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#09090b' }}>Customer Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="customer@example.com"
                                    className="input"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0' }}>
                                <input
                                    type="checkbox"
                                    id="sendImmediately"
                                    checked={sendImmediately}
                                    onChange={(e) => setSendImmediately(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor="sendImmediately" style={{ fontSize: '0.875rem', color: '#3f3f46', cursor: 'pointer', fontWeight: 500 }}>
                                    Send testimonial request email immediately
                                </label>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '-0.5rem 0 0' }}>
                                {sendImmediately
                                    ? "We'll send the request now. A reminder will follow in 3 days if they don't respond."
                                    : "We'll automatically request a testimonial 3 days from now."}
                            </p>
                            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.875rem' }}>
                                {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Starting...</> : (sendImmediately ? 'Send Email Now' : 'Start Automation')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* View Testimonial Modal */}
            {viewingTestimonial && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setViewingTestimonial(null)}>
                    <div style={{
                        background: 'white',
                        padding: '1.75rem',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '480px',
                        boxShadow: 'var(--shadow-lg)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#09090b' }}>Testimonial Details</h2>
                            <button onClick={() => setViewingTestimonial(null)} style={{ color: '#71717a' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '0.875rem', background: 'var(--input)', borderRadius: '12px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 800 }}>
                                {(viewingTestimonial.customer_name?.[0] || 'A').toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#09090b' }}>{viewingTestimonial.customer_name || 'Anonymous'}</div>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} color={i < (viewingTestimonial.rating || 5) ? '#fbbf24' : '#e4e4e7'} fill={i < (viewingTestimonial.rating || 5) ? '#fbbf24' : 'transparent'} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Testimonial Content</label>
                            <div style={{ 
                                padding: '1.25rem', 
                                background: '#f8fafc', 
                                borderRadius: '16px', 
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9375rem',
                                color: '#1e293b',
                                lineHeight: '1.6',
                                fontStyle: 'italic',
                                whiteSpace: 'pre-wrap'
                            }}>
                                "{viewingTestimonial.content.trim()}"
                            </div>
                        </div>

                        <button onClick={() => setViewingTestimonial(null)} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
