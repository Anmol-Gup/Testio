'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

import { Plus, Users, Download, ArrowLeft, Loader2, Trash2, Zap, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';

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
            <span style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'pre-line' }}>{message}</span>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const PAGE_SIZE = 10;

export default function GlobalCustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [userPlan, setUserPlan] = useState('Free');
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterProduct, setFilterProduct] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    
    // Add Customer Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [customerEmail, setCustomerEmail] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [sendImmediately, setSendImmediately] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [monthlyUsage, setMonthlyUsage] = useState(0);

    useEffect(() => {
        fetchProducts();
        fetchUserPlan();
        fetchUsage();
    }, []);

    const fetchUserPlan = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('users').select('plan').eq('id', user.id).single();
        if (data?.plan) {
            setUserPlan(data.plan.toLowerCase());
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchCustomers(1);
    }, [filterStatus, filterProduct, sortOrder]);

    useEffect(() => {
        fetchCustomers(currentPage);
    }, [currentPage]);

    const fetchProducts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        
        const { data, error } = await supabase
            .from('products')
            .select('id, name')
            .eq('user_id', user.id)
            .order('name');

        if (error) {
            console.error('Error fetching products:', error.message);
            return [];
        }
            
        if (data) {
            setProducts(data);
            if (data.length > 0 && !selectedProductId) {
                setSelectedProductId(data[0].id);
            }
        }
        return data || [];
    };

    const handleOpenAddCustomerModal = async () => {
        if (products.length > 0) {
            if (!selectedProductId) setSelectedProductId(products[0].id);
            setIsAddModalOpen(true);
            return;
        }

        const latestProducts = await fetchProducts();
        if (!latestProducts.length) {
            setToast({ message: 'No products found. Create a product first to add customers.', type: 'error' });
            return;
        }
        setSelectedProductId(latestProducts[0].id);
        setIsAddModalOpen(true);
    };

    const fetchUsage = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('customers')
            .select('id, products!inner(user_id)', { count: 'exact', head: true })
            .eq('products.user_id', user.id)
            .gte('created_at', firstDayOfMonth.toISOString());

        if (!error) {
            setMonthlyUsage(count || 0);
        }
    };

    const fetchCustomers = async (page: number) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase
                .from('customers')
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

            setCustomers(data || []);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error('Error fetching global customers:', err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProductId) {
            setToast({ message: 'Please select a product', type: 'error' });
            return;
        }

        // Check plan limits
        const plan = userPlan;
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

            const selectedProduct = products.find(p => p.id === selectedProductId);

            const { data: existingCustomer, error: existingErr } = await supabase
                .from('customers')
                .select('id')
                .eq('product_id', selectedProductId)
                .ilike('email', normalizedEmail)
                .maybeSingle();
            if (existingErr) throw existingErr;
            if (existingCustomer) {
                throw new Error('This customer already exists for this product.');
            }
            
            const { data, error } = await supabase
                .from('customers')
                .insert([{
                    product_id: selectedProductId,
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
                        productId: selectedProductId,
                        productName: selectedProduct?.name
                    })
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to send immediate email');
                }
            }

            // Refresh list if needed (only if page 1)
            if (currentPage === 1) {
                fetchCustomers(1);
            }
            
            setIsAddModalOpen(false);
            setCustomerEmail('');
            setSendImmediately(true);
            setMonthlyUsage(prev => prev + 1);

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



    const handleExportCSV = () => {
        if (userPlan !== 'pro' && userPlan !== 'starter') {
            alert('CSV Export is only available on the Starter and Pro plans. Please upgrade to export your data.');
            return;
        }
        if (customers.length === 0) return;
        const headers = ["Email", "Product", "Status", "Joined At"];
        const rows = customers.map(c => [c.email, c.products?.name || 'N/A', c.status, new Date(c.created_at).toLocaleDateString()]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `all_customers_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleDeleteCustomer = async (id: string) => {
        if (!confirm('Permanently remove this customer and stop all automation?')) return;
        
        setDeletingId(id);
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) throw error;
            
            setCustomers(customers.filter(c => c.id !== id));
            setTotalCount(prev => prev - 1);
            setToast({ message: 'Customer removed', type: 'success' });
        } catch (err: any) {
            setToast({ message: err.message, type: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="animate-fade-in">
            {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>Customers</h1>
                    <p style={{ margin: '0.4rem 0 0', color: '#71717a' }}>View and manage all customers across your active products.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Status</label>
                        <select
                            className="input"
                            style={{ padding: '0.5rem 2rem 0.5rem 1rem', minWidth: '140px' }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="responded">Responded</option>
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
                            <option value="desc">Joined (Newest)</option>
                            <option value="asc">Joined (Oldest)</option>
                        </select>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="btn btn-secondary"
                        style={{
                            height: '42px',
                            gap: '0.5rem',
                            opacity: ['pro', 'starter'].includes(userPlan) ? 1 : 0.6,
                            cursor: ['pro', 'starter'].includes(userPlan) ? 'pointer' : 'not-allowed'
                        }}
                        title={['pro', 'starter'].includes(userPlan) ? 'Export CSV' : 'Upgrade to Starter or Pro to Export'}
                    >
                        {['pro', 'starter'].includes(userPlan) ? <Download size={18} /> : <Zap size={16} color="var(--primary)" />}
                        Export
                    </button>
                    <button
                        onClick={handleOpenAddCustomerModal}
                        className="btn btn-primary"
                        style={{ height: '42px', gap: '0.5rem', padding: '0 1.5rem' }}
                    >
                        <Plus size={18} />
                        Add Customer
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="page-loader">
                    <Loader2 size={32} className="animate-spin" color="var(--primary)" />
                    <span className="page-loader-text">Loading customers...</span>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: 'var(--input)' }}>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#71717a', fontWeight: 800 }}>Email</th>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#71717a', fontWeight: 800 }}>Product</th>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#71717a', fontWeight: 800 }}>Status</th>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#71717a', fontWeight: 800 }}>Joined</th>
                                    <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#71717a', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#71717a' }}>No customers found.</td></tr>
                                ) : customers.map((customer) => (
                                    <tr key={customer.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1.25rem 2rem', fontSize: '0.9375rem', fontWeight: 600, color: '#09090b' }}>{customer.email}</td>
                                        <td style={{ padding: '1.25rem 2rem', fontSize: '0.9375rem', color: '#71717a' }}>{customer.products?.name}</td>
                                        <td style={{ padding: '1.25rem 2rem' }}>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                background: customer.status === 'responded' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: customer.status === 'responded' ? 'var(--success)' : 'var(--warning)',
                                                padding: '4px 8px',
                                                borderRadius: '20px',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                height: '22px'
                                            }}>{customer.status.replace('_', ' ')}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem', fontSize: '0.875rem', color: '#71717a' }}>{new Date(customer.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleDeleteCustomer(customer.id)} 
                                                disabled={deletingId === customer.id}
                                                style={{ color: '#ef4444', padding: '0.5rem', borderRadius: '8px', background: 'transparent', opacity: deletingId === customer.id ? 0.5 : 0.6 }}
                                                className="hover:opacity-100"
                                                title="Delete Customer"
                                            >
                                                {deletingId === customer.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalCount > PAGE_SIZE && (
                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input)' }}>
                            <div style={{ fontSize: '0.875rem', color: '#71717a' }}>
                                Showing <span style={{ fontWeight: 700, color: '#09090b' }}>{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span style={{ fontWeight: 700, color: '#09090b' }}>{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of <span style={{ fontWeight: 700, color: '#09090b' }}>{totalCount}</span> customers
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
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#09090b' }}>Select Product</label>
                                <select 
                                    className="input select-input"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    required
                                    disabled={products.length === 0}
                                >
                                    <option value="" disabled>Choose a product</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#09090b' }}>Customer Email</label>
                                <input
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
                                    id="sendImmediatelyGlobal"
                                    checked={sendImmediately}
                                    onChange={(e) => setSendImmediately(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor="sendImmediatelyGlobal" style={{ fontSize: '0.875rem', color: '#3f3f46', cursor: 'pointer', fontWeight: 500 }}>
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
        </div>
    );
}
