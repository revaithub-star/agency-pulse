'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';

export default function LoginForm({ onLogin }) {
    const [isSetup, setIsSetup] = useState(false);
    const [setupChecked, setSetupChecked] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetch('/api/auth/setup-status', { cache: 'no-store' })
            .then(response => response.json())
            .then(result => setIsSetup(result.available))
            .catch(() => setIsSetup(false))
            .finally(() => setSetupChecked(true));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch(isSetup ? '/api/auth/signup' : '/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to sign in');
            onLogin({ email: email.trim().toLowerCase(), role: result.role || 'admin', permissions: result.permissions || ['*'] });
        } catch (loginError) {
            setError(loginError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <img 
                        src="/AgencyPulseLogo.png" 
                        alt="Agency Pulse Logo" 
                        className="h-12 w-auto object-contain mx-auto mb-4" 
                    />
                    <h1 className="text-2xl font-semibold tracking-tight">{isSetup ? 'Set up your admin account' : 'Sign in to your workspace'}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Agency Project & Growth Operational Suite</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">Password</label>
                        <input id="password" type="password" minLength={8} required autoComplete={isSetup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="app-button app-button-primary w-full">
                        {isSubmitting ? (isSetup ? 'Creating account...' : 'Signing in...') : (isSetup ? 'Create admin account' : 'Sign in')}
                        {!isSubmitting && <ArrowRight size={16} />}
                    </button>
                </form>
                {setupChecked && !isSetup && <p className="mt-5 text-center text-xs text-muted-foreground">Admin signup is closed. Ask an administrator to create your account.</p>}
            </div>
        </main>
    );
}