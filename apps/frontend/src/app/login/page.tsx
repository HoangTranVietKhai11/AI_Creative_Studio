'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, Mail, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/chat');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-violet" /><div className="auth-glow auth-glow-pink" />
      <Link href="/" className="auth-back"><ArrowLeft size={16} /> Back to home</Link>
      <section className="auth-panel">
        <Link href="/" className="auth-brand"><span><Sparkles size={20} /></span>ContentPilot <em>AI</em></Link>
        <header className="auth-heading"><h1>Welcome back</h1><p>Sign in to continue creating with your AI studio.</p></header>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error" role="alert">{error}</div>}
          <label htmlFor="login-email">Email address</label>
          <div className="auth-input"><Mail size={18} /><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div>
          <label htmlFor="login-password">Password</label>
          <div className="auth-input"><LockKeyhole size={18} /><input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></div>
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? <Loader2 size={18} className="animate-spin" /> : null}{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="auth-divider"><span />or continue with<span /></div>
        <div className="auth-providers"><a href={`${apiUrl}/api/auth/google`}>Google</a><a href={`${apiUrl}/api/auth/github`}>GitHub</a></div>
        <p className="auth-switch">New to ContentPilot? <Link href="/register">Create a free account</Link></p>
      </section>
    </main>
  );
}
