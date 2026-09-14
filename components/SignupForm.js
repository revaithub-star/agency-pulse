'use client';

import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';

export default function SignupForm({ onSignupComplete }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Signup failed');
            }

            onSignupComplete();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="space-y-2 text-center">
                    <img 
                        src="/AgencyPulseLogo.png" 
                        alt="Agency Pulse Logo" 
                        className="h-12 w-auto object-contain mx-auto mb-4" 
                    />
                    <h1 className="text-3xl font-bold tracking-tight">Create Admin Account</h1>
                    <p className="text-muted-foreground text-sm">Set up your agency management system</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                id="email"
                                type="email"
                                placeholder="admin@agency.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-10 rounded-md border border-input bg-transparent pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full h-10 rounded-md border border-input bg-transparent pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirm-password" className="block text-sm font-medium">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                id="confirm-password"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full h-10 rounded-md border border-input bg-transparent pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="app-button app-button-primary w-full"
                    >
                        {isLoading ? 'Setting up...' : 'Create Admin Account'}
                    </button>
                </form>

                <p className="text-xs text-center text-muted-foreground">
                    This is a one-time setup. After signup, the admin can add other staff members from the dashboard.
                </p>
            </div>
        </main>
    );
}
