'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Check, Zap, MessageSquare, Mail, ChevronDown,
  Monitor, Clock, ShieldCheck, BarChart3, Star, Share2,
  Sparkles, FileText, LayoutGrid, UserPlus, Send, Layout, Menu, X
} from 'lucide-react';


export default function HomePage() {
  const currentYear = new Date().getFullYear();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-logo">
            <Sparkles size={24} color="var(--primary)" fill="var(--primary)" />
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Testio</span>
          </div>

          <div className="landing-nav-links">
            <a href="#features" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary)' }}>Features</a>
            <a href="#pricing" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary)' }}>Pricing</a>
            <a href="#faq" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary)' }}>FAQ</a>
          </div>

          <div className="landing-nav-actions">
            <Link href="/login" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Log In</Link>
            <Link href="/signup" className="btn btn-primary nav-cta" style={{ padding: '0.625rem 1.5rem', borderRadius: '8px' }}>Get Started Free</Link>
          </div>

          <button
            className="landing-nav-burger"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(v => !v)}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className={`landing-mobile-menu${mobileNavOpen ? ' open' : ''}`}>
          <a href="#features" onClick={() => setMobileNavOpen(false)}>Features</a>
          <a href="#pricing" onClick={() => setMobileNavOpen(false)}>Pricing</a>
          <a href="#faq" onClick={() => setMobileNavOpen(false)}>FAQ</a>

          <div className="landing-mobile-actions">
            <Link href="/login" className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '10px' }}>Log In</Link>
            <Link href="/signup" className="btn btn-primary nav-cta" style={{ padding: '0.75rem 1.25rem', borderRadius: '10px' }}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section" style={{ textAlign: 'center', padding: '6rem 1.5rem 4rem' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(139, 92, 246, 0.08)',
            color: 'var(--primary)',
            padding: '0.5rem 1rem',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Zap size={14} fill="currentColor" /> The testimonial machine for indie founders
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 800, color: 'var(--foreground)' }}>
            Collect testimonials <span style={{ color: 'var(--primary)' }}>automatically</span> — whenever you want.
          </h1>
          <p style={{ fontSize: '20px', maxWidth: '800px', margin: '1rem auto 3rem', color: 'var(--secondary)', lineHeight: '1.6' }}>
            Send requests after onboarding, after an upgrade, or anytime. Testio follows up once and gives you a beautiful widget to display them — no manual chasing.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary nav-cta" style={{ padding: '0.875rem 2rem', fontSize: '16px', borderRadius: '12px' }}>
              Get Started for Free <ArrowRight size={20} />
            </Link>
            <Link href="#video" className="btn btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '16px', borderRadius: '12px' }}>
              Watch how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video" className="section" style={{ padding: '2rem 1.5rem 6rem', background: 'white' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '1rem' }}>
              See it in <span style={{ color: 'var(--primary)' }}>action</span>
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Watch how quickly you can start collecting and displaying testimonials.
            </p>
          </div>
          <div style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', /* 16:9 Aspect Ratio */
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)',
            border: '1px solid var(--border)',
            background: 'var(--input)',
            transform: 'translateZ(0)' // Fix for border radius on some browsers
          }}>
            <iframe
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              src="https://www.youtube.com/embed/3KrqyurI6sw?start=44"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="section" style={{ background: '#ffffff', padding: '6rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '1100px' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <div style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>How it works</div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>Three simple steps to social proof</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              {
                step: "1",
                title: "Add Your Customer",
                desc: "Whenever you want a testimonial, add the customer email manually or via API. Trigger it on upgrades, renewals, or any moment.",
                icon: <UserPlus size={40} />
              },
              {
                step: "2",
                title: "Automatic Request",
                desc: "Send immediately or schedule it. Testio sends a personalized request and follows up once if they're busy.",
                icon: <Send size={40} />
              },
              {
                step: "3",
                title: "Embed & Grow",
                desc: "Approved testimonials appear instantly on your widget. Show off your social proof.",
                icon: <Layout size={40} />
              }
            ].map((item, i) => (
              <div key={i} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '3rem 2rem',
                border: '1px solid var(--border)',
                boxShadow: 'none'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'var(--primary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '14px',
                  marginBottom: '1.5rem'
                }}>{item.step}</div>
                <div style={{
                  color: 'var(--primary)',
                  marginBottom: '1.5rem'
                }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--foreground)' }}>{item.title}</h3>
                <p style={{ margin: 0, color: 'var(--secondary)', lineHeight: '1.6', fontSize: '14px' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section" style={{ background: '#fcfdfe' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>Powerful Features</h2>
            <p style={{ fontSize: '16px', color: 'var(--secondary)', maxWidth: '600px', margin: '0 auto' }}>Everything you need to automate your social proof.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {[
              { icon: <Monitor size={24} />, title: "Beautiful Widget", desc: "A clean, responsive widget that matches any design system perfectly. Branding removable on paid plans." },
              { icon: <Clock size={24} />, title: "Perfect Timing", desc: "Choose the perfect moment: send immediately, or schedule a delay so customers can experience your product first." },
              { icon: <Mail size={24} />, title: "One-Time Reminder", desc: "A single, gentle follow-up later if they haven't responded yet. No spam, just results." },
              { icon: <ShieldCheck size={24} />, title: "Manual Control", desc: "Approve or reject testimonials before they go live. You maintain full quality control." },
              { icon: <BarChart3 size={24} />, title: "Basic Analytics", desc: "Track requests sent, responses collected, and your response rate in real-time." },
              { icon: <Share2 size={24} />, title: "Manual Share", desc: "Need a testimonial now? Share a direct link to your product's submission page." }
            ].map((feature, i) => (
              <div key={i} className="card" style={{ padding: '2rem', boxShadow: 'none' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(139, 92, 246, 0.08)',
                  color: 'var(--primary)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--foreground)' }}>{feature.title}</h3>
                <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '14px', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section" style={{ background: '#ffffff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>Simple Pricing</h2>
            <p style={{ fontSize: '16px', color: 'var(--secondary)' }}>Choose the plan that fits your current growth.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', justifyContent: 'center' }}>
            {/* Free Plan */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Free</h3>
              <p style={{ fontSize: '14px', color: 'var(--secondary)', marginBottom: '1.5rem' }}>Attract founders & validate</p>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '2rem' }}>
                $0<span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--secondary)' }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', flex: 1 }}>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> 1 Product</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> 10 emails per month</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> Fixed 3-day automation</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> Basic dashboard stats</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> Testio Branding</li>
              </ul>
              <Link href="/signup" className="btn btn-secondary nav-cta" style={{ width: '100%', padding: '0.75rem' }}>Get Started</Link>
            </div>

            {/* Starter Plan */}
            <div className="card" style={{ border: '2px solid var(--primary)', position: 'relative', transform: 'scale(1.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--primary)',
                color: 'white',
                padding: '2px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Most Popular</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Starter</h3>
              <p style={{ fontSize: '14px', color: 'var(--secondary)', marginBottom: '1.5rem' }}>For growing SaaS products</p>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '2rem' }}>
                $19<span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--secondary)' }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', flex: 1 }}>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px', fontWeight: 700 }}>Everything in Free, plus:</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> Up to 3 Products</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> 200 email per month</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> Remove Testio Branding</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px', color: 'var(--muted)' }}><Clock size={16} /> Still 3-day fixed delay</li>
              </ul>
              <Link href="/signup" className="btn btn-primary nav-cta" style={{ width: '100%', padding: '0.75rem' }}>Get Started</Link>
            </div>

            {/* Pro Plan */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Pro</h3>
              <p style={{ fontSize: '14px', color: 'var(--secondary)', marginBottom: '1.5rem' }}>Scaling with social proof</p>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '2rem' }}>
                $39<span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--secondary)' }}>/mo</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', flex: 1 }}>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px', fontWeight: 700 }}>Everything in Starter, plus:</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> Unlimited Products</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> 1,000 emails per month</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> CSV Export of testimonials</li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '14px' }}><Check size={18} color="var(--success)" /> Priority email support</li>
              </ul>
              <Link href="/signup" className="btn btn-secondary nav-cta" style={{ width: '100%', padding: '0.75rem' }}>Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section" style={{ background: '#fcfdfe' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>FAQ</h2>
            <p style={{ fontSize: '16px', color: 'var(--secondary)' }}>Common questions about Testio.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { q: "How does the 3-day delay work?", a: "Once you add a customer to Testio, we schedule an email to be sent exactly 72 hours later. This delay ensures the customer has had time to experience your product's value before being asked for a review. This timing is fixed for all plans to ensure best results." },
              { q: "What happens if a customer doesn't respond?", a: "If the customer hasn't submitted a testimonial within 3 days of the initial request, we send one final friendly reminder. We never send more than 2 emails per customer to avoid being intrusive." },
              { q: "Can I embed the testimonials on my site?", a: "Yes! Every product has a unique embed code. Just copy and paste one line of HTML into your site and your approved testimonials will appear instantly. You can remove the 'Powered by' branding on Starter and Pro plans." },
              { q: "Do my customers need a Testio account?", a: "No. Customers click a unique link in their email and fill out a simple form on a beautiful submission page. It's designed to take less than 30 seconds." }
            ].map((item, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div key={i} className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.25rem', borderRadius: '12px', boxShadow: 'none' }}>
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    style={{
                      width: '100%',
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '1rem', color: '#3f3f46' }}>{item.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        color: 'var(--secondary)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </button>
                  <div style={{
                    maxHeight: isOpen ? '500px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'var(--input)'
                  }}>
                    <p style={{ padding: '1.5rem', margin: 0, lineHeight: '1.7', fontSize: '14px', color: 'var(--secondary)' }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="container">
          <p style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: 400 }}>
            © {currentYear} Testio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
