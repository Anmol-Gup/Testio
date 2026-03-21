import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('id');

    if (!productId) {
        return new NextResponse('Missing product id', { status: 400 });
    }

    // Fetch approved testimonials and product settings
    const { data: productData, error: productErr } = await supabase
        .from('products')
        .select('id, name, widget_settings, user_id')
        .eq('id', productId)
        .single();

    if (productErr || !productData) {
        return new NextResponse('Product not found', { status: 404 });
    }

    const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', productData.user_id)
        .single();

    const settings = (productData as any).widget_settings || {};
    const ownerPlan = userData?.plan || 'free';

    const { data: testimonials, error: testErr } = await supabase
        .from('testimonials')
        .select('id, content, customer_name, company, rating, created_at')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(settings.maxTestimonials || 6);

    if (testErr) {
        console.error('Widget API Error: ', testErr);
        return new NextResponse('Error fetching testimonials', { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const widgetJs = `
(function() {
    const PRODUCT_ID = '${productId}';
    const settings = ${JSON.stringify(settings)};
    const testimonials = ${JSON.stringify(testimonials || [])};

    if (!testimonials.length) return;

    const style = document.createElement('style');
    style.textContent = \`
        .testio-widget-container {
            padding: \${settings.padding || 24}px;
            background: \${settings.backgroundColor || 'transparent'};
            \${settings.gradient && settings.gradient !== 'none' ? \`background-image: \${settings.gradient};\` : ''}
            display: flex;
            flex-direction: column;
            align-items: \${settings.horizontalAlign === 'center' ? 'center' : (settings.horizontalAlign === 'right' ? 'flex-end' : 'flex-start')};
            gap: \${settings.cardGap || 16}px;
            font-family: \${settings.fontFamily === 'inherit' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' : settings.fontFamily};
        }
        .testio-grid {
            display: \${settings.layout === 'carousel' ? 'flex' : 'grid'};
            grid-template-columns: \${settings.layout === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : (settings.layout === 'carousel' ? 'none' : '1fr')};
            flex-direction: \${settings.layout === 'carousel' ? 'row' : 'column'};
            overflow-x: \${settings.layout === 'carousel' ? 'auto' : 'visible'};
            scroll-snap-type: \${settings.layout === 'carousel' ? 'x mandatory' : 'none'};
            gap: \${settings.cardGap || 16}px;
            width: 100%;
            max-width: \${settings.maxWidth ? settings.maxWidth + 'px' : '100% '};
            padding-bottom: \${settings.layout === 'carousel' ? '12px' : '0'};
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .testio-grid::-webkit-scrollbar { display: none; }
        .testio-card {
            background: \${settings.cardBgColor === 'default' || !settings.cardBgColor ? (settings.theme === 'dark' ? '#1e293b' : '#ffffff') : settings.cardBgColor};
            border: 1px solid #e2e8f0;
            border-radius: \${settings.cardBorderRadius !== undefined ? settings.cardBorderRadius : 12}px;
            padding: 1.5rem;
            box-shadow: \${(!settings.cardShadow || settings.cardShadow === 'small') ? '0 1px 3px rgba(0,0,0,0.1)' : (settings.cardShadow === 'none' ? 'none' : (settings.cardShadow === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' : '0 10px 15px rgba(0,0,0,0.1)'))};
            text-align: \${settings.textAlign || 'left'};
            display: flex;
            flex-direction: column;
            flex-shrink: \${settings.layout === 'carousel' ? 0 : 1};
            width: \${settings.layout === 'carousel' ? '300px' : 'auto'};
            scroll-snap-align: \${settings.layout === 'carousel' ? 'start' : 'none'};
            \${settings.animationType === 'fade-in' ? 'animation: testioFadeIn 0.5s ease-out forwards;' : ''}
            \${settings.animationType === 'slide-up' ? 'animation: testioSlideUp 0.5s ease-out forwards;' : ''}
            \${settings.animationType === 'zoom-in' ? 'animation: testioZoomIn 0.5s ease-out forwards;' : ''}
            opacity: \${settings.animationType && settings.animationType !== 'none' ? '0' : '1'};
        }
        @keyframes testioFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes testioSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes testioZoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .testio-stars {
            display: flex;
            gap: 2px;
            margin-bottom: 0.75rem;
            justify-content: \${settings.textAlign === 'center' ? 'center' : (settings.textAlign === 'right' ? 'flex-end' : 'flex-start')};
        }
        .testio-star {
            width: \${settings.starSize || 18}px;
            height: \${settings.starSize || 18}px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            flex: 0 0 \${settings.starSize || 18}px;
        }
        .testio-star svg {
            width: \${settings.starSize || 18}px;
            height: \${settings.starSize || 18}px;
            display: block;
        }
        .testio-quote {
            font-size: \${settings.fontSize || 14}px;
            font-weight: \${settings.fontWeight || 400};
            color: \${settings.cardTextColor === 'default' || !settings.cardTextColor ? (settings.theme === 'dark' ? '#f1f5f9' : '#334155') : settings.cardTextColor};
            line-height: 1.6;
            margin-bottom: 1.25rem;
            font-style: italic;
        }
        .testio-author {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-direction: \${settings.textAlign === 'center' ? 'column' : 'row'};
            justify-content: \${settings.textAlign === 'center' ? 'center' : (settings.textAlign === 'right' ? 'flex-end' : 'flex-start')};
        }
        .testio-details { text-align: \${settings.textAlign === 'center' ? 'center' : 'left'}; }
        .testio-name { font-weight: 700; font-size: 0.875rem; color: \${settings.cardTextColor === 'default' || !settings.cardTextColor ? (settings.theme === 'dark' ? '#f8fafc' : '#0f172a') : settings.cardTextColor}; }
        .testio-company { font-size: 0.75rem; color: \${settings.cardTextColor === 'default' || !settings.cardTextColor ? '#64748b' : settings.cardTextColor}; opacity: 0.8; }
        .testio-powered {
            margin-top: 1.5rem;
            text-align: center;
            width: 100%;
            opacity: 0.5;
            font-size: 0.625rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            color: \${settings.theme === 'dark' ? '#94a3b8' : '#64748b'};
        }
    \`;
    document.head.appendChild(style);

    const container = document.getElementById('testio-widget');
    if (!container) return;

    container.innerHTML = \`
        <div class="testio-widget-container">
            <div class="testio-grid">
                \${testimonials.map(t => \`
                    <div class="testio-card">
                        \${settings.showStars !== false ? \`
                            <div class="testio-stars">
                                \${[1,2,3,4,5].map(star => \`
                                    <span class="testio-star" aria-hidden="true">
                                        <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="\${star <= (Number(t.rating) || 5) ? '#fbbf24' : '#e2e8f0'}">
                                            <path d="M10 1.667l2.575 5.219 5.759.837-4.167 4.061.983 5.736L10 14.813l-5.15 2.707.983-5.736-4.167-4.061 5.759-.837L10 1.667z"/>
                                        </svg>
                                    </span>
                                \`).join('')}
                            </div>
                        \` : ''}
                        <p class="testio-quote">"\${t.content}"</p>
                        <div class="testio-author">
                            <div class="testio-details">
                                <div class="testio-name">\${t.customer_name}</div>
                                \${settings.showCompany !== false && t.company ? \`<div class="testio-company">\${t.company}</div>\` : ''}
                            </div>
                        </div>
                    </div>
                \`).join('')}
            </div>
            ${ownerPlan.toLowerCase() === 'free' ? `
                <div class="testio-powered">⚡ POWERED BY TESTIO</div>
            ` : ''}
        </div>
    \`;
})();
`;

    return new NextResponse(widgetJs, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=60',
        }
    });
}
