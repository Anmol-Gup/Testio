'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthSessionDebug() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;

        const logSessionState = async (reason: string) => {
            const { data: { session } } = await supabase.auth.getSession();
            const key = Object.keys(window.localStorage).find((k) => k.includes('-auth-token'));
            const hasStoredToken = key ? !!window.localStorage.getItem(key) : false;

            console.log('[AuthDebug]', {
                reason,
                origin: window.location.origin,
                hasSession: !!session,
                userId: session?.user?.id || null,
                expiresAt: session?.expires_at || null,
                storageKey: key || null,
                hasStoredToken,
            });
        };

        logSessionState('initial-load');

        const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
            const key = Object.keys(window.localStorage).find((k) => k.includes('-auth-token'));
            const hasStoredToken = key ? !!window.localStorage.getItem(key) : false;

            console.log('[AuthDebug]', {
                reason: 'auth-state-change',
                event,
                origin: window.location.origin,
                hasSession: !!session,
                userId: session?.user?.id || null,
                expiresAt: session?.expires_at || null,
                storageKey: key || null,
                hasStoredToken,
            });
        });

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                logSessionState('tab-visible');
            }
        };

        window.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            subscription.subscription.unsubscribe();
            window.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    return null;
}

