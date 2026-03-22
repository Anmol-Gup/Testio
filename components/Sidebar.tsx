'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    CreditCard,
    Settings,
    LogOut,
    Sparkles,
    Users,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function Sidebar({
    mobileOpen,
    onMobileClose,
}: {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
        { name: 'Billing', href: '/billing', icon: CreditCard },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            router.push('/login');
        } else {
            console.error('Logout error:', error.message);
        }
    };

    const sidebarClassName = `sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`;

    return (
        <div className={sidebarClassName}>
            <button
                className="sidebar-mobile-close"
                aria-label="Close sidebar"
                onClick={() => onMobileClose?.()}
            >
                <X size={18} />
            </button>

            {/* Desktop collapse toggle */}
            <button
                className="sidebar-toggle"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
            </button>

            {/* Logo */}
            <div
                style={{
                    marginBottom: '1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: collapsed ? '0' : '0 0.25rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    overflow: 'hidden',
                }}
            >
                <Sparkles size={26} color="var(--primary)" fill="var(--primary)" style={{ flexShrink: 0 }} />
                <h2
                    className="sidebar-label"
                    style={{
                        margin: 0,
                        fontSize: '1.125rem',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color: '#09090b',
                    }}
                >
                    Testio
                </h2>
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={collapsed ? item.name : undefined}
                            onClick={() => onMobileClose?.()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: collapsed ? '0' : '0.75rem',
                                padding: collapsed ? '0' : '0.625rem 0.875rem',
                                height: '40px',
                                width: collapsed ? '40px' : '100%',
                                margin: collapsed ? '0 auto' : '0',
                                borderRadius: '0.625rem',
                                textDecoration: 'none',
                                background: isActive ? '#f4f4f5' : 'transparent',
                                color: isActive ? '#09090b' : '#71717a',
                                fontWeight: isActive ? 700 : 500,
                                fontSize: '0.875rem',
                                transition: 'all 0.15s ease',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                            }}
                            className="sidebar-nav-link"
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = '#f4f4f5';
                                    (e.currentTarget as HTMLElement).style.color = '#09090b';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = '#71717a';
                                }
                            }}
                        >
                            <item.icon size={18} style={{ flexShrink: 0 }} />
                            {!collapsed && <span className="sidebar-label">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Sign Out */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                    onClick={handleSignOut}
                    title={collapsed ? 'Sign Out' : undefined}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: collapsed ? '0' : '0.75rem',
                        padding: collapsed ? '0' : '0.625rem 0.875rem',
                        height: '40px',
                        width: collapsed ? '40px' : '100%',
                        margin: collapsed ? '0 auto' : '0',
                        borderRadius: '0.625rem',
                        background: 'transparent',
                        color: 'var(--error)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                >
                    <LogOut size={18} style={{ flexShrink: 0 }} />
                    <span className="sidebar-label">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
