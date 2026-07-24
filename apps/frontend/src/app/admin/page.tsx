'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Folder, FileText, Image as ImageIcon, MessageSquare, Target } from 'lucide-react';
import { api } from '@/lib/api';

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalDocuments: number;
  totalMedia: number;
  totalConversations: number;
  totalMessages: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<SystemStats>('/api/admin/stats');
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải thống kê');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Người dùng', value: stats?.totalUsers || 0, icon: <Users className="w-6 h-6 text-blue-500" />, color: 'bg-blue-500/10' },
    { title: 'Dự án', value: stats?.totalProjects || 0, icon: <Folder className="w-6 h-6 text-green-500" />, color: 'bg-green-500/10' },
    { title: 'Tài liệu (RAG)', value: stats?.totalDocuments || 0, icon: <FileText className="w-6 h-6 text-yellow-500" />, color: 'bg-yellow-500/10' },
    { title: 'Ảnh / Video', value: stats?.totalMedia || 0, icon: <ImageIcon className="w-6 h-6 text-purple-500" />, color: 'bg-purple-500/10' },
    { title: 'Cuộc trò chuyện', value: stats?.totalConversations || 0, icon: <MessageSquare className="w-6 h-6 text-rose-500" />, color: 'bg-rose-500/10' },
    { title: 'Tin nhắn AI', value: stats?.totalMessages || 0, icon: <Target className="w-6 h-6 text-cyan-500" />, color: 'bg-cyan-500/10' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        <header>
          <h1 className="text-3xl font-bold font-headline-lg text-on-background">Tổng quan Hệ thống</h1>
          <p className="text-on-surface-variant mt-2 font-body-md">
            Số liệu thống kê hoạt động của toàn bộ nền tảng ContentPilot AI.
          </p>
        </header>

        {error && (
          <div className="p-4 bg-error-container/20 text-error rounded-xl border border-error/20 flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-surface-container-low rounded-2xl border border-outline-variant animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 bg-surface rounded-2xl border border-outline-variant flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-on-surface-variant text-sm font-medium mb-1">{card.title}</p>
                  <h3 className="text-3xl font-bold text-on-background">{card.value.toLocaleString()}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
