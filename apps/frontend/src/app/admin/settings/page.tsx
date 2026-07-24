'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface SystemConfig {
  key: string;
  value: string;
  description: string | null;
  isSecret: boolean;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const fetchConfigs = async () => {
    try {
      const res = await api.get<SystemConfig[]>('/api/admin/configs');
      setConfigs((res as any).data ?? res);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải cấu hình hệ thống');
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (key: string, isSecret: boolean) => {
    try {
      await api.put(`/api/admin/configs/${key}`, { value: editValue, isSecret });
      setEditKey(null);
      fetchConfigs();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu cấu hình');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col h-full overflow-y-auto">
        <header className="mb-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold font-headline-lg text-on-background">Cài đặt Hệ thống</h1>
            <p className="text-on-surface-variant mt-2 font-body-md">
              Quản lý API Keys và các cấu hình chung của ứng dụng.
            </p>
          </div>
        </header>

        {error && (
          <div className="p-4 mb-6 bg-error-container/20 text-error rounded-xl border border-error/20 flex items-center gap-3 shrink-0">
            <span className="material-symbols-outlined">error</span>
            <p>{error}</p>
          </div>
        )}

        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm mb-6 max-w-3xl">
          <h2 className="text-xl font-bold mb-4 border-b border-outline-variant pb-2">API Keys & Tokens</h2>
          
          <div className="space-y-6">
            {/* OpenRouter API Key */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-on-surface">OpenRouter API Key (Dùng chung cho toàn hệ thống)</label>
              <p className="text-sm text-on-surface-variant">Sẽ được sử dụng nếu người dùng không cung cấp API key cá nhân.</p>
              
              {editKey === 'OPENROUTER_GLOBAL_KEY' ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="flex-1 px-4 py-2 bg-background border border-outline-variant rounded-xl focus:border-primary outline-none"
                  />
                  <button onClick={() => handleSave('OPENROUTER_GLOBAL_KEY', true)} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-medium">Lưu</button>
                  <button onClick={() => setEditKey(null)} className="px-4 py-2 bg-surface-variant text-on-surface rounded-xl font-medium">Hủy</button>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <input
                    type="password"
                    disabled
                    value={configs.find(c => c.key === 'OPENROUTER_GLOBAL_KEY')?.value ? '********' : ''}
                    placeholder="Chưa cấu hình"
                    className="flex-1 px-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl outline-none opacity-70"
                  />
                  <button 
                    onClick={() => {
                      setEditKey('OPENROUTER_GLOBAL_KEY');
                      setEditValue(''); // Don't show existing secret for security, let them overwrite
                    }}
                    className="px-4 py-2 bg-surface-variant text-on-surface hover:bg-surface-container-high transition-colors rounded-xl font-medium"
                  >
                    Thay đổi
                  </button>
                </div>
              )}
            </div>

            {/* Application Name */}
            <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant/50">
              <label className="font-medium text-on-surface">Tên ứng dụng</label>
              
              {editKey === 'APP_NAME' ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-4 py-2 bg-background border border-outline-variant rounded-xl focus:border-primary outline-none"
                  />
                  <button onClick={() => handleSave('APP_NAME', false)} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-medium">Lưu</button>
                  <button onClick={() => setEditKey(null)} className="px-4 py-2 bg-surface-variant text-on-surface rounded-xl font-medium">Hủy</button>
                </div>
              ) : (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    disabled
                    value={configs.find(c => c.key === 'APP_NAME')?.value || 'AI Creative Studio'}
                    className="flex-1 px-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl outline-none opacity-70"
                  />
                  <button 
                    onClick={() => {
                      setEditKey('APP_NAME');
                      setEditValue(configs.find(c => c.key === 'APP_NAME')?.value || 'AI Creative Studio');
                    }}
                    className="px-4 py-2 bg-surface-variant text-on-surface hover:bg-surface-container-high transition-colors rounded-xl font-medium"
                  >
                    Thay đổi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
