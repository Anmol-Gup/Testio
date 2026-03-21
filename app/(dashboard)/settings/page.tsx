'use client';

import { User, Mail, Shield, Bell, LogOut, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string, email: string, name: string }>({ id: '', email: '', name: '' });
    const [name, setName] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchUser(retryCount = 0) {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (!isMounted) return;

                if (error) {
                    if (error.message.includes('lock broken') && retryCount < 3) {
                        // Retry if it's the lock error
                        setTimeout(() => fetchUser(retryCount + 1), 100);
                        return;
                    }
                    console.error('Auth error:', error.message);
                }

                if (user) {
                    const userData = {
                        id: user.id,
                        email: user.email || '',
                        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
                    };
                    setUser(userData);
                    setName(userData.name);
                }
            } catch (err: any) {
                if (err.name === 'AbortError' || err.message.includes('lock broken')) {
                    if (retryCount < 3) {
                        setTimeout(() => fetchUser(retryCount + 1), 100);
                        return;
                    }
                }
                console.error('Fetch user error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchUser();
        return () => { isMounted = false; };
    }, []);

    const handleUpdateProfile = async () => {
        setMessage(null);
        const { error } = await supabase.auth.updateUser({
            data: { name: name }
        });

        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setUser(prev => ({ ...prev, name }));
        }
    };

    const handleChangePassword = async () => {
        setMessage(null);
        if (!newPassword.trim() || !confirmPassword.trim()) {
            setMessage({ text: 'Please fill in new password and confirmation', type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ text: 'Passwords do not match', type: 'error' });
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            // Log out user and redirect to login
            alert('Password changed successfully! Please log in with your new password.');
            await supabase.auth.signOut();
            router.push('/login');
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm('ARE YOU ABSOLUTELY SURE? This will permanently delete your account and all associated data. This action cannot be undone.');
        if (!confirmed) return;

        const doubleCheck = window.confirm('Final confirmation: Deletion is permanent. Proceed?');
        if (!doubleCheck) return;

        // In a real app, you'd call an API route to delete the user via admin client
        // For now, we'll sign them out and simulate deletion (since client SDK can't delete own user directly usually)
        const { error } = await supabase.auth.signOut();
        if (!error) {
            alert('Account deleted successfully (Simulated). In a production environment, this would remove all data.');
            router.push('/signup');
        }
    };

    if (loading) {
        return (
            <div className="page-loader">
                <Loader2 size={32} className="animate-spin" color="var(--primary)" />
                <span className="page-loader-text">Loading settings...</span>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#09090b', letterSpacing: '-0.02em' }}>Account Settings</h1>
                <p style={{ margin: '0.25rem 0 0', color: '#71717a' }}>Manage your profile and application preferences.</p>
            </header>

            {message && (
                <div style={{
                    marginBottom: '2rem',
                    padding: '1rem',
                    borderRadius: '12px',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Profile Section */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <User size={20} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ margin: 0, color: '#09090b', fontWeight: 700 }}>Profile Information</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#09090b' }}>Full Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#09090b' }}>Email Address</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={user.email}
                                    disabled
                                    style={{ background: '#f8fafc', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleUpdateProfile}
                            className="btn btn-primary"
                            style={{ alignSelf: 'flex-start' }}
                        >
                            Update Profile
                        </button>
                    </div>
                </div>

                {/* Security Section */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <Shield size={20} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ margin: 0, color: '#09090b', fontWeight: 700 }}>Security</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* New Password */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#09090b' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    className="input"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{ paddingRight: '3rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#09090b' }}>Confirm New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="input"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{ paddingRight: '3rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleChangePassword}
                            className="btn btn-primary"
                            style={{ alignSelf: 'flex-start' }}
                        >
                            Change Password
                        </button>
                    </div>
                </div>

                {/* Hide Notifications Section for now */}
                {/* 
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <Bell size={20} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ margin: 0, color: '#09090b', fontWeight: 700 }}>Notifications</h3>
                    </div>
                    ...
                </div>
                */}

                {/* Danger Zone */}
                <div className="card" style={{
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    background: 'rgba(239, 68, 68, 0.02)',
                    padding: '2rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <LogOut size={20} style={{ color: '#ef4444' }} />
                        <h3 style={{ margin: 0, color: '#ef4444', fontWeight: 700 }}>Danger Zone</h3>
                    </div>
                    <p style={{ fontSize: '0.9375rem', marginBottom: '1.5rem', color: '#71717a' }}>Once you delete your account, there is no going back. Please be certain.</p>
                    <button
                        onClick={handleDeleteAccount}
                        className="btn"
                        style={{ background: '#ef4444', color: 'white', fontWeight: 600 }}
                    >
                        Delete Account Permanently
                    </button>
                </div>
            </div>
        </div>
    );
}
