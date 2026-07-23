'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, Sparkles, Zap, Building2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const plans = [
  {
    id: 'FREE' as const,
    name: 'Free',
    icon: <Sparkles className="w-6 h-6" />,
    price: '$0',
    period: '/month',
    features: ['50 messages/month', '5 documents', '2 AI models', 'Basic agents'],
    color: '#777777',
  },
  {
    id: 'PRO' as const,
    name: 'Pro',
    icon: <Zap className="w-6 h-6" />,
    price: '$29',
    period: '/month',
    features: ['2,000 messages/month', '100 documents', '6 AI models', 'All 10 agents', 'Live trend search', 'Image & video analysis'],
    color: '#888888',
  },
  {
    id: 'AGENCY' as const,
    name: 'Agency',
    icon: <Building2 className="w-6 h-6" />,
    price: '$99',
    period: '/month',
    features: ['10,000 messages/month', '1,000 documents', '10+ AI models', 'All agents', 'Auto knowledge updates', 'Custom API key', 'Team features'],
    color: '#10B981',
  },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data: any = await api.get('/api/billing/subscription');
      setSubscription(data.data);
    } catch (err) {
      // Don't show error if 404 (no active subscription, defaults to FREE)
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message || 'Không thể tải thông tin gói cước');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      setError('');
      const data: any = await api.post('/api/billing/checkout', { plan });
      if (data.data?.url) window.location.href = data.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể khởi tạo thanh toán');
    }
  };

  const handleManage = async () => {
    try {
      setError('');
      const data: any = await api.post('/api/billing/portal');
      if (data.data?.url) window.location.href = data.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể mở trang quản lý');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
        <CreditCard className="w-7 h-7" style={{ color: '#a6a6a6' }} />
        Billing
      </h1>
      <p className="text-sm mb-8" style={{ color: 'hsl(0 0% 55%)' }}>Manage your plan and usage</p>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* Usage Banner */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#777777' }} /></div>
      ) : (
        <div className="p-6 rounded-2xl mb-8" style={{ background: 'hsl(0 0% 11%)', border: '1px solid hsl(0 0% 18%)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Current Plan: <span className="gradient-text">{subscription?.plan || 'FREE'}</span></h2>
            {subscription && subscription.plan !== 'FREE' && (
              <button onClick={handleManage} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'hsl(0 0% 18%)', color: 'hsl(0 0% 65%)' }}>
                Manage Subscription
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: 'hsl(0 0% 45%)' }}>Messages</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full" style={{ background: 'hsl(0 0% 18%)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, ((subscription?.messagesUsed || 0) / (subscription?.messagesLimit || 50)) * 100)}%`,
                    background: 'linear-gradient(90deg, #777777, #888888)',
                  }} />
                </div>
                <span className="text-xs" style={{ color: 'hsl(0 0% 55%)' }}>
                  {subscription?.messagesUsed || 0} / {subscription?.messagesLimit || 50}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'hsl(0 0% 45%)' }}>Documents</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full" style={{ background: 'hsl(0 0% 18%)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(100, ((subscription?.documentsUsed || 0) / (subscription?.documentsLimit || 5)) * 100)}%`,
                    background: 'linear-gradient(90deg, #10B981, #a6a6a6)',
                  }} />
                </div>
                <span className="text-xs" style={{ color: 'hsl(0 0% 55%)' }}>
                  {subscription?.documentsUsed || 0} / {subscription?.documentsLimit || 5}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = subscription?.plan === plan.id;
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl relative"
              style={{
                background: isCurrent ? 'linear-gradient(135deg, hsl(0 0% 15%), hsl(0 0% 18%))' : 'hsl(0 0% 13%)',
                border: isCurrent ? `1px solid ${plan.color}40` : '1px solid hsl(0 0% 18%)',
                boxShadow: isCurrent ? `0 0 30px ${plan.color}15` : 'none',
              }}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ background: plan.color, color: 'white' }}>
                  Current Plan
                </div>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${plan.color}15`, color: plan.color }}>
                {plan.icon}
              </div>
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-sm" style={{ color: 'hsl(0 0% 45%)' }}>{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10B981' }} />
                    <span style={{ color: 'hsl(0 0% 70%)' }}>{f}</span>
                  </li>
                ))}
              </ul>
              {!isCurrent && plan.id !== 'FREE' && (
                <button onClick={() => handleUpgrade(plan.id)} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: plan.color, color: 'white' }}>
                  Upgrade to {plan.name}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
