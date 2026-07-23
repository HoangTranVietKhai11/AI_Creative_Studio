'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadUser } = useAuthStore();

  useEffect(() => {
    let active = true;
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      loadUser()
        .then(() => { if (active && useAuthStore.getState().isAuthenticated) router.replace('/chat'); })
        .catch(() => { if (active) router.replace('/login?error=oauth_failed'); });
    } else {
      router.replace('/login?error=oauth_failed');
    }
    return () => { active = false; };
  }, [searchParams, router, loadUser]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(0 0% 6%)' }}>
      <div className="flex flex-col items-center gap-4">
        <Sparkles className="w-10 h-10 animate-pulse" style={{ color: '#777777' }} />
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#777777' }} />
        <p style={{ color: 'hsl(0 0% 55%)' }}>Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return <Suspense fallback={<AuthCallbackFallback />}><AuthCallback /></Suspense>;
}

function AuthCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(0 0% 6%)' }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#777777' }} />
    </div>
  );
}
