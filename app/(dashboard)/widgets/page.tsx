'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WidgetsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.push('/products');
    }, [router]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
            <p>Redirecting to products...</p>
        </div>
    );
}
