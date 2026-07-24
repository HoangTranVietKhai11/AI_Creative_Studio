'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Agent {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  systemPrompt: string;
  model: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Partial<Agent>>({});

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Agent[]>('/api/admin/agents');
      setAgents(res);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách Trợ lý AI');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSave = async () => {
    try {
      if (currentAgent.id) {
        await api.put(`/api/admin/agents/${currentAgent.id}`, currentAgent);
      } else {
        await api.put('/api/admin/agents', currentAgent);
      }
      setIsEditing(false);
      setCurrentAgent({});
      fetchAgents();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu Trợ lý AI');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa trợ lý AI này?')) return;
    try {
      await api.delete(`/api/admin/agents/${id}`);
      fetchAgents();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa trợ lý AI');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col h-full overflow-y-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-bold font-headline-lg text-on-background">Trợ lý AI (Agents)</h1>
            <p className="text-on-surface-variant mt-2 font-body-md">
              Quản lý các Agent mẫu có sẵn cho người dùng.
            </p>
          </div>
          <button
            onClick={() => { setCurrentAgent({ isActive: true }); setIsEditing(true); }}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl font-medium shadow hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Thêm Agent Mới
          </button>
        </header>

        {error && (
          <div className="p-4 mb-6 bg-error-container/20 text-error rounded-xl border border-error/20 flex items-center gap-3 shrink-0">
            <span className="material-symbols-outlined">error</span>
            <p>{error}</p>
          </div>
        )}

        {isEditing ? (
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-4">{currentAgent.id ? 'Sửa Agent' : 'Thêm Agent Mới'}</h2>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1">Mã định danh (name) *</label>
                <input
                  type="text"
                  value={currentAgent.name || ''}
                  onChange={e => setCurrentAgent({ ...currentAgent, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-outline-variant rounded-xl focus:border-primary outline-none"
                  placeholder="seo_expert"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tên hiển thị (displayName) *</label>
                <input
                  type="text"
                  value={currentAgent.displayName || ''}
                  onChange={e => setCurrentAgent({ ...currentAgent, displayName: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-outline-variant rounded-xl focus:border-primary outline-none"
                  placeholder="Chuyên gia SEO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={currentAgent.description || ''}
                  onChange={e => setCurrentAgent({ ...currentAgent, description: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-outline-variant rounded-xl focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">System Prompt *</label>
                <textarea
                  value={currentAgent.systemPrompt || ''}
                  onChange={e => setCurrentAgent({ ...currentAgent, systemPrompt: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-outline-variant rounded-xl focus:border-primary outline-none min-h-[150px]"
                  placeholder="Bạn là một chuyên gia SEO..."
                />
              </div>
              <div className="flex gap-4">
                <button onClick={handleSave} className="px-6 py-2 bg-primary text-on-primary rounded-xl font-medium">
                  Lưu
                </button>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-surface-variant text-on-surface rounded-xl font-medium">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-on-surface-variant">Đang tải...</div>
            ) : agents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface border border-outline-variant rounded-2xl">
                Chưa có Agent nào được cấu hình.
              </div>
            ) : (
              agents.map(agent => (
                <div key={agent.id} className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col shadow-sm hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setCurrentAgent(agent); setIsEditing(true); }} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(agent.id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold font-headline-sm mb-1">{agent.displayName}</h3>
                  <p className="text-sm font-mono text-on-surface-variant mb-2">@{agent.name}</p>
                  <p className="text-sm text-on-surface line-clamp-3 mb-4 flex-1">
                    {agent.description || agent.systemPrompt}
                  </p>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-outline'}`} />
                    <span className="text-xs font-medium text-on-surface-variant">{agent.isActive ? 'Đang hoạt động' : 'Tạm dừng'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
