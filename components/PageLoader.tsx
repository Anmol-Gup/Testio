'use client';

import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
    text?: string;
}

export default function PageLoader({ text = 'Loading...' }: PageLoaderProps) {
    return (
        <div className="page-loader">
            <Loader2
                size={36}
                className="animate-spin"
                color="var(--primary)"
            />
            <span className="page-loader-text">{text}</span>
        </div>
    );
}
