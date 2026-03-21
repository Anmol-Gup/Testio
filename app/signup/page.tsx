'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Signup failed. Please try again.');
            } else {
                setSuccess(true);
                // Redirecting to login after a short delay or showing success
                setTimeout(() => {
                    router.push('/login?signup=success');
                }, 2000);
            }
        } catch (err) {
            setError('An unexpected error occurred during signup.');
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
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>Create your account</h1>
                    <p style={{ color: 'var(--secondary)' }}>Start collecting testimonials today</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {error && (
                            <div style={{ padding: '0.75rem', paddingLeft: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid var(--error)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--error)' }}>
                                {error}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label htmlFor="name" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="input"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

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
                            <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Password</label>
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

                        {success && (
                            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '3px solid var(--success)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--success)' }}>
                                Account created! Please check your email inbox to confirm your account before logging in.
                            </div>
                        )}

                        <p style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                            By creating an account, you agree to our <Link href="#" style={{ fontWeight: 600 }}>Terms of Service</Link> and <Link href="#" style={{ fontWeight: 600 }}>Privacy Policy</Link>.
                        </p>

                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Get Started <ArrowRight size={18} /></>}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--secondary)' }}>
                    Already have an account? <Link href="/login" style={{ fontWeight: 700, color: 'var(--primary)' }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
