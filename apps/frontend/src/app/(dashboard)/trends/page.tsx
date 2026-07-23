'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

const trendCategories = [
  { id: 'tiktok-trends', label: 'TikTok Trends', icon: 'movie' },
  { id: 'content-marketing', label: 'Content Marketing', icon: 'trending_up' },
  { id: 'social-media', label: 'Social Media', icon: 'share' },
  { id: 'video-creator', label: 'Video Creator', icon: 'video_library' },
  { id: 'ecommerce', label: 'eCommerce', icon: 'shopping_bag' },
];

export default function TrendsPage() {
  const [selectedCategory, setSelectedCategory] = useState('content-marketing');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    const topic = query.trim() || selectedCategory;
    if (!topic) return;
    setLoading(true);
    setError('');
    setResult('');
    try {
      let token = await api.getValidToken();
      let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: `Phân tích các xu hướng ${topic} đang nổi bật nhất hiện nay. Liệt kê top 5 xu hướng với mô tả chi tiết, cơ hội và cách áp dụng thực tế cho content creator.`,
          model: 'openai/gpt-4o-mini',
        }),
      });
      if (res.status === 401) {
        const refreshed = await api.refreshTokenIfNeeded();
        if (refreshed) {
          token = localStorage.getItem('accessToken');
          res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              message: `Phân tích các xu hướng ${topic} đang nổi bật nhất hiện nay. Liệt kê top 5 xu hướng với mô tả chi tiết, cơ hội và cách áp dụng thực tế cho content creator.`,
              model: 'openai/gpt-4o-mini',
            }),
          });
        }
      }
      if (!res.ok) throw new Error('Không thể tải dữ liệu xu hướng. Vui lòng đăng nhập lại.');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;
          try {
            const json = JSON.parse(data);
            if (json.type === 'text' && json.content) {
              full += json.content;
              setResult(full);
            }
          } catch { continue; }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
          <TrendingUp className="w-7 h-7 text-tertiary" />
          Xu hướng
        </h1>
        <p className="text-sm text-on-surface-variant">Khám phá các xu hướng nội dung đang hot để bắt đầu ý tưởng mới</p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {trendCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-sm text-label-sm transition-all border ${
              selectedCategory === cat.id
                ? 'bg-primary text-on-primary border-primary'
                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary bg-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Custom Query */}
      <div className="flex gap-3 mb-8">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          placeholder={`Hoặc nhập chủ đề riêng của bạn...`}
          className="flex-1 px-4 py-3 rounded-xl bg-surface border border-outline-variant text-on-background placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-body-md"
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary-container transition-colors disabled:opacity-60"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'Đang phân tích...' : 'Phân tích'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container border border-error/20 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-surface border border-outline-variant"
        >
          <div className="prose prose-invert max-w-none text-on-background font-body-md text-body-md leading-relaxed whitespace-pre-wrap">
            {result}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center py-20">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-outline" />
          <p className="text-on-surface-variant font-body-md">Chọn danh mục hoặc nhập chủ đề rồi bấm Phân tích</p>
        </div>
      )}
    </div>
  );
}
