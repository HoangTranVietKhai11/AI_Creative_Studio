'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Project {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  niche: string | null;
  createdAt: string;
  _count?: { conversations: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', industry: '', niche: '', brandVoice: '', targetAudience: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data: any = await api.get('/api/projects');
      setProjects(data.data?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dự án');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!formData.name.trim()) {
      setError('Tên dự án không được để trống');
      return;
    }
    try {
      setError('');
      await api.post('/api/projects', formData);
      setShowCreate(false);
      setFormData({ name: '', description: '', industry: '', niche: '', brandVoice: '', targetAudience: '' });
      loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo dự án');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await api.delete(`/api/projects/${id}`);
      loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa dự án');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FolderKanban className="w-7 h-7" style={{ color: '#888888' }} />
            Projects
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(0 0% 55%)' }}>
            Organize your content by brand, client, or campaign
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #777777, #7a7a7a)', color: 'white' }}
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg p-6 rounded-2xl" style={{ background: 'hsl(0 0% 11%)', border: '1px solid hsl(0 0% 18%)' }}>
            <h2 className="text-lg font-bold mb-4">Create Project</h2>
            <div className="space-y-4">
              {['name', 'description', 'industry', 'niche', 'brandVoice', 'targetAudience'].map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium mb-1 capitalize" style={{ color: 'hsl(0 0% 55%)' }}>
                    {field.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    value={(formData as any)[field]}
                    onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', color: 'hsl(0 0% 90%)' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'hsl(0 0% 55%)' }}>Cancel</button>
              <button onClick={createProject} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#777777', color: 'white' }}>Create</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#777777' }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(0 0% 30%)' }} />
          <p className="text-lg font-medium mb-2">No projects yet</p>
          <p className="text-sm" style={{ color: 'hsl(0 0% 45%)' }}>Create your first project to organize your content</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-2xl transition-all hover:-translate-y-1"
              style={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 18%)' }}
            >
              <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-sm mb-3" style={{ color: 'hsl(0 0% 55%)' }}>{project.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs" style={{ color: 'hsl(0 0% 45%)' }}>
                {project.industry && <span className="px-2 py-0.5 rounded-full" style={{ background: 'hsl(0 0% 18%)' }}>{project.industry}</span>}
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {project._count?.conversations || 0} chats</span>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => deleteProject(project.id)} className="p-1.5 rounded-lg transition-all" style={{ color: 'hsl(0 0% 60%)' }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
