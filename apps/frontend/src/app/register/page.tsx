'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, Mail, Loader2, Sparkles, UserRound } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      router.replace('/chat');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tạo tài khoản. Vui lòng thử lại.');
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
        <header className="auth-heading"><h1>Tạo không gian làm việc của bạn</h1><p>Bắt đầu miễn phí và biến ý tưởng của bạn thành nội dung tuyệt vời.</p></header>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error" role="alert">{error}</div>}
          <label htmlFor="register-name">Tên của bạn</label>
          <div className="auth-input"><UserRound size={18} /><input id="register-name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Chúng tôi nên gọi bạn là gì?" autoComplete="name" required /></div>
          <label htmlFor="register-email">Địa chỉ Email</label>
          <div className="auth-input"><Mail size={18} /><input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" autoComplete="email" required /></div>
          <label htmlFor="register-password">Mật khẩu</label>
          <div className="auth-input"><LockKeyhole size={18} /><input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 8 ký tự" autoComplete="new-password" required minLength={8} /></div>
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? <Loader2 size={18} className="animate-spin" /> : null}{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản miễn phí'}</button>
        </form>
        <div className="auth-divider"><span />hoặc tiếp tục với<span /></div>
        <div className="auth-providers"><a href={`${apiUrl}/api/auth/google`}>Google</a><a href={`${apiUrl}/api/auth/github`}>GitHub</a></div>
        <p className="auth-switch">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>
      </section>
    </main>
  );
}
