'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const RESET_EMAIL = 'prakashsurya1204@gmail.com';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(RESET_EMAIL, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) {
                setError(resetError.message);
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError('An unexpected error occurred.');
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
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>Reset Password</h1>
                    <p style={{ color: 'var(--secondary)' }}>Enter your email to receive a reset link</p>
                </div>

                <div className="card">
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--success)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>Check your email</h2>
                            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                If an account exists with this email, a password reset link must have been sent.
                            </p>
                            <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

                            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}>
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
                            </button>

                            <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 600, marginTop: '0.5rem' }}>
                                <ArrowLeft size={16} /> Back to Login
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
