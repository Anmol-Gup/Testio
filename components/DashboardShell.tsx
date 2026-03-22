'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!sidebarOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [sidebarOpen]);

    useEffect(() => {
        if (!sidebarOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSidebarOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [sidebarOpen]);

    return (
        <div className="dashboard-layout">
            <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

            <button
                className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
                aria-label="Close sidebar"
                aria-hidden={!sidebarOpen}
                onClick={() => setSidebarOpen(false)}
                tabIndex={sidebarOpen ? 0 : -1}
                type="button"
            />

            <div className="dashboard-main">
                <div className="dashboard-topbar">
                    <button
                        className="dashboard-topbar-btn"
                        aria-label="Open sidebar"
                        onClick={() => setSidebarOpen(true)}
                        type="button"
                    >
                        <Menu size={18} />
                    </button>
                    <div className="dashboard-topbar-title">Testio</div>
                </div>

                <main className="main-content">{children}</main>
            </div>
        </div>
    );
}
