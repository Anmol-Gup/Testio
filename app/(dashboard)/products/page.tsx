'use client';

import { Plus, Users, Mail, MessageSquare, Check, X, Copy, Code, ExternalLink, CheckCircle2, AlertCircle, Package, Loader2, Trash2, ArrowRight, Crown, Zap } from 'lucide-react';
import Link from 'next/link';
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

// Upgrade Banner Component
const PlanUpgradeBanner = ({ count, limit, plan }: { count: number, limit: number, plan: string }) => {
    return (
        <div style={{
            background: 'rgba(139, 92, 246, 0.05)',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            borderRadius: '16px',
            padding: '1.25rem 2rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'white',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.1)'
                }}>
                    <Crown size={22} fill="rgba(139, 92, 246, 0.1)" />
                </div>
                <div style={{ fontSize: '0.9375rem', color: '#3f3f46', fontWeight: 500 }}>
                    You've used <span style={{ fontWeight: 800, color: '#09090b' }}>{count} of {limit}</span> products on your <span style={{ textTransform: 'capitalize', fontWeight: 800, color: 'var(--primary)' }}>{plan}</span> plan. Upgrade for unlimited products.
                </div>
            </div>
            <Link href="/billing" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem', fontSize: '0.875rem' }}>
                Upgrade
            </Link>
        </div>
    );
};

interface Product {
    id: string;
    name: string;
    website_url: string;
    slug: string;
    created_at: string;
    testimonial_count?: number;
    upgrade_count?: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductUrl, setNewProductUrl] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [userPlan, setUserPlan] = useState('Free');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 8;

    useEffect(() => {
        fetchProducts();
        fetchUserPlan();
    }, []);

    const fetchUserPlan = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('users').select('plan').eq('id', user.id).single();
        setUserPlan(data?.plan || 'Free');
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch products with testimonails to count them accurately
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    testimonials(status),
                    customers(count)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedProducts = data.map((p: any) => ({
                ...p,
                testimonial_count: p.testimonials?.filter((t: any) => t.status === 'approved').length || 0,
                upgrade_count: p.customers?.[0]?.count || 0
            }));

            setProducts(formattedProducts);
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic URL validation
        const urlPattern = /^(https?:\/\/)?([\w.-]+\.[a-zA-Z]{2,})(\/[^\s]*)?$/i;
        if (!urlPattern.test(newProductUrl)) {
            setToast({ message: 'Please enter a valid URL (e.g. example.com)', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const plan = userPlan.toLowerCase();
            const productCount = products.length;

            if (plan === 'free' && productCount >= 1) {
                throw new Error('Free plan is limited to 1 product. Please upgrade to create more.');
            }
            if (plan === 'starter' && productCount >= 3) {
                throw new Error('Starter plan is limited to 3 products. Please upgrade to Pro for unlimited access.');
            }

            const { data, error } = await supabase
                .from('products')
                .insert([{
                    name: newProductName,
                    website_url: newProductUrl.startsWith('http') ? newProductUrl : `https://${newProductUrl}`,
                    user_id: user.id
                }])
                .select()
                .single();

            if (error) throw error;

            setProducts([{ ...data, testimonial_count: 0, upgrade_count: 0 }, ...products]);
            setCurrentPage(1);
            setIsModalOpen(false);
            setNewProductName('');
            setNewProductUrl('');
            setToast({ message: 'Product created successfully!', type: 'success' });
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product? All testimonials and customers will be removed.')) return;

        setDeletingId(id);
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProducts(products.filter(p => p.id !== id));
            setToast({ message: 'Product deleted', type: 'success' });
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setToast({ message: `${label} copied!`, type: 'success' });
    };

    return (
        <div className="animate-fade-in">
            {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

            {products.length > 0 && !loading && (
                (() => {
                    const plan = userPlan.toLowerCase();
                    const count = products.length;
                    let limit = 0;
                    if (plan === 'free') limit = 1;
                    else if (plan === 'starter') limit = 3;

                    if (limit > 0 && count >= limit) {
                        return <PlanUpgradeBanner count={count} limit={limit} plan={plan} />;
                    }
                    return null;
                })()
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>My Products</h1>
                    <p style={{ margin: '0.4rem 0 0', color: '#71717a' }}>Manage your products and their social proof automation.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} /> Add Product
                </button>
            </header>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                    <Loader2 size={40} className="animate-spin" color="var(--primary)" />
                </div>
            ) : products.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        color: 'var(--primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <Package size={32} />
                    </div>
                    <h3 style={{ marginBottom: '0.5rem' }}>No products yet</h3>
                    <p style={{ color: '#71717a', marginBottom: '2rem' }}>Create your first product to start collecting testimonials.</p>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} /> Create Product
                    </button>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Stats</th>
                                    <th>Created</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((product) => (
                                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td>
                                            <div>
                                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#09090b' }}>{product.name}</div>
                                                <a href={product.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: '#71717a', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                    {product.website_url.replace('https://', '').replace('http://', '')} <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Approved</span>
                                                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#09090b' }}>{product.testimonial_count}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Customers</span>
                                                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#09090b' }}>{product.upgrade_count}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {new Date(product.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => copyToClipboard(`${window.location.origin}/submit/${product.id}`, 'Share link')}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
                                                    title="Copy share link"
                                                >
                                                    <Copy size={14} /> <span className="hidden md:inline">Link</span>
                                                </button>
                                                <button
                                                    onClick={() => copyToClipboard(`<div id="testio-widget"></div>\n<script src="${window.location.origin}/api/widget?id=${product.id}" defer></script>`, 'Embed code')}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
                                                    title="Copy embed code"
                                                >
                                                    <Code size={14} /> <span className="hidden md:inline">Embed</span>
                                                </button>
                                                <Link
                                                    href={`/products/${product.id}`}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
                                                >
                                                    <ArrowRight size={14} /> <span className="hidden md:inline">Manage</span>
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    disabled={deletingId === product.id}
                                                    style={{ 
                                                        color: '#ef4444', 
                                                        width: '32px', 
                                                        height: '32px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        borderRadius: '8px',
                                                        background: 'rgba(239, 68, 68, 0.05)',
                                                        transition: 'background 0.2s',
                                                        opacity: deletingId === product.id ? 0.5 : 1
                                                    }}
                                                    className="hover:bg-red-50"
                                                    title="Delete product"
                                                >
                                                    {deletingId === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {products.length > PAGE_SIZE && (
                        <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input)' }}>
                            <div style={{ fontSize: '0.8125rem', color: '#71717a' }}>
                                Showing <span style={{ fontWeight: 700, color: '#09090b' }}>{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span style={{ fontWeight: 700, color: '#09090b' }}>{Math.min(currentPage * PAGE_SIZE, products.length)}</span> of <span style={{ fontWeight: 700, color: '#09090b' }}>{products.length}</span> products
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    disabled={currentPage * PAGE_SIZE >= products.length}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem', opacity: currentPage * PAGE_SIZE >= products.length ? 0.5 : 1 }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )
}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2 className="modal-title">Add New Product</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="modal-close-btn"
                                    aria-label="Close"
                                    disabled={isSubmitting}
                                    type="button"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddProduct} className="modal-form">
                                <div className="field">
                                    <label className="field-label">Product Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Testio"
                                        className="input"
                                        value={newProductName}
                                        onChange={e => setNewProductName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAddProduct(e as any) }}
                                        autoFocus
                                    />
                                </div>
                                <div className="field">
                                    <label className="field-label">Website URL</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. testio.com"
                                        className="input"
                                        value={newProductUrl}
                                        onChange={e => setNewProductUrl(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAddProduct(e as any) }}
                                    />
                                </div>
                                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '0.75rem', padding: '0.875rem' }}>
                                    {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Creating...</> : 'Create Product'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
