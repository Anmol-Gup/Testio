'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Sparkles, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: resetError } = await supabase.auth.updateUser({
                password: password
            });

            if (resetError) {
                setError(resetError.message);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
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
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>New Password</h1>
                    <p style={{ color: 'var(--secondary)' }}>Enter your new secure password</p>
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
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>Password updated!</h2>
                            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
                                Your password has been successfully reset. Redirecting you to login...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {error && (
                                <div style={{ padding: '0.75rem', paddingLeft: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid var(--error)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--error)' }}>
                                    {error}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>New Password</label>
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
                                        minLength={6}
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
                                            padding: 0
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}>
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
