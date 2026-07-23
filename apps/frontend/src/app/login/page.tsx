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
      setError(reason instanceof Error ? reason.message : 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-violet" /><div className="auth-glow auth-glow-pink" />
      <Link href="/" className="auth-back"><ArrowLeft size={16} /> Về trang chủ</Link>
      <section className="auth-panel">
        <Link href="/" className="auth-brand"><span><Sparkles size={20} /></span>ContentPilot <em>AI</em></Link>
        <header className="auth-heading"><h1>Chào mừng trở lại</h1><p>Đăng nhập để tiếp tục sáng tạo với không gian AI của bạn.</p></header>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error" role="alert">{error}</div>}
          <label htmlFor="login-email">Địa chỉ Email</label>
          <div className="auth-input"><Mail size={18} /><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" autoComplete="email" required /></div>
          <label htmlFor="login-password">Mật khẩu</label>
          <div className="auth-input"><LockKeyhole size={18} /><input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu của bạn" autoComplete="current-password" required /></div>
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? <Loader2 size={18} className="animate-spin" /> : null}{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        </form>
        <div className="auth-divider"><span />hoặc tiếp tục với<span /></div>
        <div className="auth-providers"><a href={`${apiUrl}/api/auth/google`}>Google</a><a href={`${apiUrl}/api/auth/github`}>GitHub</a></div>
        <p className="auth-switch">Người mới đến ContentPilot? <Link href="/register">Tạo tài khoản miễn phí</Link></p>
      </section>
    </main>
  );
}
