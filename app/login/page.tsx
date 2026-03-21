'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Sparkles, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ color: 'var(--secondary)', fontWeight: 600 }}>Loading…</div>
                </div>
            }
        >
            <LoginPageInner />
        </Suspense>
    );
}

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const signupSuccess = searchParams.get('signup') === 'success';
    const isVerified = searchParams.get('verified') === 'true';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const redirectIfLoggedIn = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (active && session) {
                router.replace('/dashboard');
            }
        };

        redirectIfLoggedIn();

        const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
            if (!active) return;
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                router.replace('/dashboard');
            }
        });

        return () => {
            active = false;
            subscription.subscription.unsubscribe();
        };
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('An unexpected error occurred during login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'var(--background)'
        }}>
            <div className="animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
                        <Sparkles size={32} color="var(--primary)" fill="var(--primary)" />
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#020617' }}>Testio</span>
                    </div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>Welcome back</h1>
                    <p style={{ color: 'var(--secondary)' }}>Login to manage your testimonials</p>
                </div>

                <div className="card">
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {signupSuccess && !error && !isVerified && (
                            <div style={{ padding: '0.75rem', paddingLeft: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid var(--success)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <CheckCircle2 size={16} />
                                <span>Account created! Please verify your email to log in.</span>
                            </div>
                        )}
                        {isVerified && !error && (
                            <div style={{ padding: '0.75rem', paddingLeft: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #3b82f6', borderRadius: '6px', fontSize: '0.875rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <CheckCircle2 size={16} />
                                <span>Email verified successfully! You can now log in.</span>
                            </div>
                        )}
                        {error && (
                            <div style={{ padding: '0.75rem', paddingLeft: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid var(--error)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--error)' }}>
                                {error}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    className="input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Password</label>
                                <Link href="/forgot-password" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Forgot password?</Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="input"
                                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--secondary)',
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={18} /></>}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                    Don't have an account? <Link href="/signup" style={{ fontWeight: 700, color: 'var(--primary)' }}>Create an account</Link>
                </p>
            </div>
        </div>
    );
}
