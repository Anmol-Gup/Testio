import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Widget Preview | Testio',
};

import Script from 'next/script';

export default function WidgetPreviewPage({
    searchParams
}: {
    searchParams: { id?: string }
}) {
    const productId = searchParams.id ?? '';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return (
        <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            background: '#f8fafc',
            margin: 0,
            padding: '2rem',
            minHeight: '100vh'
        }}>
            <div id="testio-widget"></div>
            {productId && (
                <Script
                    src={`${appUrl}/api/widget?id=${productId}`}
                    strategy="lazyOnload"
                />
            )}
        </div>
    );
}
