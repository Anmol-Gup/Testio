'use client';

import { useState } from 'react';
import { Sparkles, ExternalLink, CheckCircle2, Copy } from 'lucide-react';

export default function WidgetTestPage() {
    const [productId, setProductId] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [copied, setCopied] = useState(false);

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const widgetUrl = `${appUrl}/api/widget?id=${productId}`;
    const embedCode = `<!-- Testio Widget -->\n<div id="testio-widget"></div>\n<script src="${widgetUrl}" defer></script>`;
    const previewUrl = productId ? `/widget-test/preview?id=${productId}` : '';

    const copyEmbed = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            padding: '3rem 1.5rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                    <Sparkles size={30} color="#8b5cf6" fill="#8b5cf6" />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#09090b' }}>Widget Tester</h1>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#71717a' }}>Test the Testio embed widget with your product ID</p>
                    </div>
                </div>

                {/* Step 1: Enter Product ID */}
                <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '2rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#09090b', margin: '0 0 1rem' }}>
                        <span style={{ background: '#8b5cf6', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', marginRight: '0.5rem' }}>1</span>
                        Enter your Product ID
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#71717a', margin: '0 0 1rem' }}>
                        Find your Product ID in the URL when viewing a product: <code style={{ background: '#f4f4f5', padding: '2px 6px', borderRadius: 4, fontSize: '0.8125rem' }}>/products/YOUR-ID</code>
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            type="text"
                            value={productId}
                            onChange={e => { setProductId(e.target.value); setLoaded(false); }}
                            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.625rem',
                                fontSize: '0.9375rem',
                                color: '#09090b',
                                outline: 'none',
                            }}
                        />
                        <button
                            disabled={!productId}
                            onClick={() => setLoaded(true)}
                            style={{
                                background: '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.625rem',
                                fontWeight: 700,
                                fontSize: '0.9375rem',
                                cursor: productId ? 'pointer' : 'not-allowed',
                                opacity: productId ? 1 : 0.5
                            }}
                        >
                            Load Widget
                        </button>
                    </div>
                </div>

                {/* Step 2: Get embed code */}
                {productId && (
                    <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '2rem', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#09090b', margin: '0 0 1rem' }}>
                            <span style={{ background: '#8b5cf6', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', marginRight: '0.5rem' }}>2</span>
                            Your Embed Code
                        </h2>
                        <div style={{ position: 'relative' }}>
                            <pre style={{
                                background: '#09090b',
                                color: '#a3e635',
                                padding: '1.25rem 1.5rem',
                                borderRadius: '0.75rem',
                                fontSize: '0.8125rem',
                                lineHeight: 1.7,
                                overflow: 'auto',
                                margin: 0
                            }}>{embedCode}</pre>
                            <button
                                onClick={copyEmbed}
                                style={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    right: '0.75rem',
                                    background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Preview */}
                {loaded && productId && (
                    <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#09090b', margin: 0 }}>
                                <span style={{ background: '#8b5cf6', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', marginRight: '0.5rem' }}>3</span>
                                Live Preview
                            </h2>
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#8b5cf6', fontWeight: 600 }}
                            >
                                Open in new tab <ExternalLink size={14} />
                            </a>
                        </div>
                        <iframe
                            src={previewUrl}
                            style={{ width: '100%', minHeight: 400, border: 'none', display: 'block' }}
                            title="Widget Preview"
                        />
                    </div>
                )}

                {/* Instructions */}
                <div style={{ background: '#faf5ff', borderRadius: '1rem', border: '1px solid #e9d5ff', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#6d28d9', margin: '0 0 0.75rem' }}>📋 How to embed on your website</h3>
                    <ol style={{ fontSize: '0.875rem', color: '#71717a', paddingLeft: '1.25rem', lineHeight: 2, margin: 0 }}>
                        <li>Copy the embed code above</li>
                        <li>Paste it in your website’s HTML where you want testimonials to appear</li>
                        <li>Only <strong>approved</strong> testimonials will be shown</li>
                        <li>The widget automatically refreshes every 60 seconds</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
