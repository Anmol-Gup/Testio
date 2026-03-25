'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Check, X, Trash2, Loader2, Star, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';

const PAGE_SIZE = 10;

export default function GlobalTestimonialsPage() {
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [viewingTestimonial, setViewingTestimonial] = useState<any>(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterProduct, setFilterProduct] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        fetchProducts();
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        fetchTestimonials(1);
    }, [filterStatus, filterProduct, sortOrder]);

    useEffect(() => {
        fetchTestimonials(currentPage);
    }, [currentPage]);

    const fetchProducts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
            .from('products')
            .select('id, name')
            .eq('user_id', user.id)
            .order('name');
            
        if (data) setProducts(data);
    };

    const fetchTestimonials = async (page: number) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase
                .from('testimonials')
                .select('*, products!inner(name, user_id)', { count: 'exact' })
                .eq('products.user_id', user.id);

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }
            if (filterProduct !== 'all') {
                query = query.eq('product_id', filterProduct);
            }

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: sortOrder === 'asc' })
                .range(from, to);

            if (error) throw error;

            setTestimonials(data || []);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error('Error:', err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleUpdate = async (id: string, isApproved: boolean) => {
        try {
            const newStatus = isApproved ? 'approved' : 'pending';
            const { error } = await supabase
                .from('testimonials')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setTestimonials(testimonials.map(t => t.id === id ? { ...t, status: newStatus } : t));
        } catch (err: any) {
            console.error('Update error:', err.message);
        }
    };


    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete this testimonial?')) return;
        try {
            const { error } = await supabase.from('testimonials').delete().eq('id', id);
            if (error) throw error;
            setTestimonials(testimonials.filter(t => t.id !== id));
        } catch (err: any) {
            console.error('Delete error:', err.message);
        }
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>Testimonials</h1>
                    <p style={{ margin: '0.4rem 0 0', color: '#71717a' }}>Manage and approve testimonials from all your products.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Status</label>
                        <select
                            className="input"
                            style={{ padding: '0.5rem 2rem 0.5rem 1rem', minWidth: '140px' }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Product</label>
                        <select
                            className="input"
                            style={{ padding: '0.5rem 2rem 0.5rem 1rem', minWidth: '160px' }}
                            value={filterProduct}
                            onChange={(e) => setFilterProduct(e.target.value)}
                        >
                            <option value="all">All Products</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Sort</label>
                        <select
                            className="input"
                            style={{ padding: '0.5rem 2rem 0.5rem 1rem', minWidth: '120px' }}
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as any)}
                        >
                            <option value="desc">Newest</option>
                            <option value="asc">Oldest</option>
                        </select>
                    </div>
                </div>
            </header>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                    <Loader2 size={40} className="animate-spin" color="var(--primary)" />
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <div className="table-scroll">
<table className="data-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Testimonial</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testimonials.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>No testimonials found.</td></tr>
                                ) : testimonials.map((t) => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', background: 'var(--input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: 'var(--primary)', flexShrink: 0 }}>
                                                    {t.customer_name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#09090b' }}>{t.customer_name || 'Anonymous'}</div>
                                                    <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={8} color={i < (t.rating || 5) ? '#fbbf24' : '#e4e4e7'} fill={i < (t.rating || 5) ? '#fbbf24' : 'transparent'} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: '#71717a' }}>{t.products?.name}</td>
                                        <td className="cell-wrap">
                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: '#09090b',
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
                                        <td>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                background: t.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: t.status === 'approved' ? 'var(--success)' : 'var(--warning)',
                                                padding: '4px 8px',
                                                borderRadius: '20px',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                height: '22px'
                                            }}>{t.status === 'approved' ? 'Approved' : 'Pending'}</span>
                                        </td>
                                        <td className="text-right">
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => setViewingTestimonial(t)}
                                                    style={{ color: '#09090b', padding: '0.4rem', borderRadius: '8px', background: 'transparent' }}
                                                    title="View Full Testimonial"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdate(t.id, t.status !== 'approved')}
                                                    style={{
                                                        color: t.status === 'approved' ? 'var(--warning)' : 'var(--success)',
                                                        padding: '0.5rem',
                                                        borderRadius: '8px',
                                                        background: 'transparent'
                                                    }}
                                                    title={t.status === 'approved' ? 'Unapprove' : 'Approve'}
                                                >
                                                    {t.status === 'approved' ? <X size={18} /> : <Check size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    style={{ color: 'var(--error)', padding: '0.5rem', borderRadius: '8px' }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
</div>
                    </div>
                    {totalCount > PAGE_SIZE && (
                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input)' }}>
                            <div style={{ fontSize: '0.875rem', color: '#71717a' }}>
                                Showing <span style={{ fontWeight: 700, color: '#09090b' }}>{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span style={{ fontWeight: 700, color: '#09090b' }}>{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of <span style={{ fontWeight: 700, color: '#09090b' }}>{totalCount}</span> testimonials
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    disabled={currentPage * PAGE_SIZE >= totalCount}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', opacity: currentPage * PAGE_SIZE >= totalCount ? 0.5 : 1 }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* View Testimonial Modal */}
            {isMounted && viewingTestimonial && createPortal((
                <div className="modal-overlay" onClick={() => setViewingTestimonial(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-card">
                            <div className="modal-header">
                                <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>Testimonial Details</h2>
                                <button onClick={() => setViewingTestimonial(null)} className="modal-close-btn" aria-label="Close" type="button"><X size={18} /></button>
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
                                    <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
                                        Product: <span style={{ fontWeight: 600, color: '#09090b' }}>{viewingTestimonial.products?.name}</span>
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
                </div>
            ), document.body)}

        </div>
    );
}
