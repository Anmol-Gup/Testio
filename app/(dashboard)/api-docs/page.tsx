'use client';

import { useEffect } from 'react';

export default function ApiDocsPage() {
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js';
        script.async = true;
        script.onload = () => {
            if ((window as any).SwaggerUIBundle) {
                (window as any).SwaggerUIBundle({
                    url: '/openapi.json',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        (window as any).SwaggerUIBundle.presets.apis,
                    ],
                });
            }
        };
        document.body.appendChild(script);

        return () => {
            document.head.removeChild(link);
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div style={{ height: 'calc(100vh - 100px)', width: '100%', background: 'white', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'auto' }}>
            <div id="swagger-ui"></div>
        </div>
    );
}
