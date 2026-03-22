'use client';

import { TrendingUp, Users, Mail, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
    const [stats, setStats] = useState([
        { label: 'Customers', value: '0', icon: <Users size={20} />, trend: '0%', color: 'var(--primary)' },
        { label: 'Requests', value: '0', icon: <Mail size={20} />, trend: '0%', color: '#8b5cf6' },
        { label: 'Responses', value: '0', icon: <MessageSquare size={20} />, trend: '0%', color: '#ec4899' },
        { label: 'Conv. Rate', value: '0%', icon: <TrendingUp size={20} />, trend: '0%', color: 'var(--success)' },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // 1. Fetch Stats Aggregates
            // Filter by current user's products
            const { count: totalUpgraders } = await supabase
                .from('customers')
                .select('id, products!inner(user_id)', { count: 'exact', head: true })
                .eq('products.user_id', user.id);
            
            const { count: totalResponses } = await supabase
                .from('testimonials')
                .select('id, products!inner(user_id)', { count: 'exact', head: true })
                .eq('products.user_id', user.id);

            const rate = totalUpgraders ? Math.round(((totalResponses || 0) / (totalUpgraders || 1)) * 100) : 0;

            const up = totalUpgraders || 0;
            const res = totalResponses || 0;
            setStats([
                { label: 'Customers', value: up.toString(), icon: <Users size={20} />, trend: up > 0 ? `+${Math.min(100, up * 5)}%` : '0%', color: 'var(--primary)' },
                { label: 'Requests', value: up.toString(), icon: <Mail size={20} />, trend: up > 0 ? `+${Math.min(100, Math.round(up * 3.5))}%` : '0%', color: '#8b5cf6' },
                { label: 'Responses', value: res.toString(), icon: <MessageSquare size={20} />, trend: res > 0 ? `+${Math.min(100, Math.round(res * 6))}%` : '0%', color: '#ec4899' },
                { label: 'Conv. Rate', value: `${rate}%`, icon: <TrendingUp size={20} />, trend: rate > 0 ? `+${Math.min(100, Math.round(rate * 0.5))}%` : '0%', color: 'var(--success)' },
            ]);

            // 2. Fetch Top Products
            const { data: prods, error } = await supabase
                .from('products')
                .select(`
                    id, 
                    name, 
                    testimonials (count),
                    customers (count)
                `)
                .eq('user_id', user.id)
                .limit(3);

            if (error) throw error;

            const formattedProds = prods.map((p: any) => {
                const tests = p.testimonials?.[0]?.count || 0;
                const custs = p.customers?.[0]?.count || 0;
                return {
                    id: p.id,
                    name: p.name,
                    count: tests,
                    rate: custs ? `${Math.round((tests / custs) * 100)}%` : '0%'
                };
            });

            setProducts(formattedProds);

            // 3. Fetch Recent Customers
            const { data: recentCusts } = await supabase
                .from('customers')
                .select('*, products!inner(name, user_id)')
                .eq('products.user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentCustomers(recentCusts || []);

        } catch (error: any) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="page-loader">
            <Loader2 size={32} className="animate-spin" color="var(--primary)" />
            <span className="page-loader-text">Loading dashboard...</span>
        </div>
    );

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>Dashboard</h1>
                <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '0.25rem' }}>Welcome back! Here's your social proof performance.</p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'white',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: stat.color,
                                boxShadow: 'inset 0 0 0 1px var(--border)'
                            }}>
                                {stat.icon}
                            </div>
                            <div style={{
                                padding: '4px 8px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--success)',
                                borderRadius: '30px',
                                fontSize: '0.75rem',
                                fontWeight: 800
                            }}>
                                {stat.trend}
                            </div>
                        </div>
                        <div>
                            <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 800, color: '#09090b', marginBottom: '0.25rem' }}>{stat.value}</div>
                            <div className="stat-label" style={{ fontSize: '0.875rem', color: '#71717a', fontWeight: 600 }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-two-col" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.25rem' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Recent Customers</h3>
                        <Link href="/customers" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View All</Link>
                    </div>
                    <div style={{ overflowX: 'hidden' }}>
                        <div className="table-scroll">
<table className="data-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Product</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#71717a', fontSize: '0.9375rem' }}>
                                            No customers yet. <Link href="/products" style={{ color: 'var(--primary)', fontWeight: 600 }}>Add your first product →</Link>
                                        </td>
                                    </tr>
                                ) : recentCustomers.map((customer) => (
                                    <tr key={customer.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ fontSize: '0.9rem', fontWeight: 600, color: '#09090b' }}>{customer.email}</td>
                                        <td style={{ fontSize: '0.9rem', color: '#71717a' }}>{customer.products?.name ?? '—'}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                background: customer.status === 'responded' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(113, 113, 122, 0.1)',
                                                color: customer.status === 'responded' ? 'var(--success)' : '#71717a',
                                                padding: '3px 10px',
                                                borderRadius: '20px',
                                                fontWeight: 700,
                                                textTransform: 'capitalize'
                                            }}>{(customer.status ?? '').replace('_', ' ')}</span>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: '#71717a' }}>{new Date(customer.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
</div>
                    </div>
                </div>


                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Top Products</h3>
                        <Link href="/products" className="btn btn-secondary" style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>View All Products</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem 2rem' }}>
                        {products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1rem', color: '#71717a' }}>No products found.</div>
                        ) : products.map((product, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'var(--input)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    color: 'var(--primary)',
                                    fontSize: '1.25rem',
                                    boxShadow: 'inset 0 0 0 1px var(--border)'
                                }}>{product.name[0]}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#09090b' }}>{product.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#71717a' }}>{product.count} testimonials</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#09090b' }}>{product.rate}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>Conv. Rate</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
