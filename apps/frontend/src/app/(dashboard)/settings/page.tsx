'use client';

import { useState } from 'react';
import { Settings, Key, Save, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { AVAILABLE_MODELS } from '@contentpilot/shared';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [apiKey, setApiKey] = useState('');
  const [preferredModel, setPreferredModel] = useState(user?.preferredModel || 'anthropic/claude-sonnet-4');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [error, setError] = useState('');

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      const data: any = await api.put('/api/users/profile', { name, preferredModel });
      setUser({ ...user!, ...data.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu hồ sơ');
    } finally { setSaving(false); }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    setError('');
    try {
      await api.post('/api/users/api-key', { apiKey });
      setApiKey('');
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu API Key');
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-3 mb-8">
        <Settings className="w-7 h-7" style={{ color: '#7a7a7a' }} />
        Settings
      </h1>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* Profile */}
      <div className="p-6 rounded-2xl mb-6" style={{ background: 'hsl(0 0% 11%)', border: '1px solid hsl(0 0% 18%)' }}>
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(0 0% 55%)' }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', color: 'hsl(0 0% 90%)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(0 0% 55%)' }}>Email</label>
            <input value={user?.email || ''} disabled className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', color: 'hsl(0 0% 45%)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(0 0% 55%)' }}>Default AI Model</label>
            <select value={preferredModel} onChange={e => setPreferredModel(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', color: 'hsl(0 0% 90%)' }}>
              {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.provider}</option>)}
            </select>
          </div>
          <button disabled={saving} onClick={saveProfile} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: '#777777', color: 'white' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* API Key */}
      <div className="p-6 rounded-2xl" style={{ background: 'hsl(0 0% 11%)', border: '1px solid hsl(0 0% 18%)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5" style={{ color: '#F59E0B' }} />
          <h2 className="text-lg font-semibold">Your API Key (BYOK)</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: 'hsl(0 0% 55%)' }}>
          Bring your own OpenRouter API key to bypass platform limits.
          Your key is encrypted at rest.
        </p>
        <div className="flex gap-2">
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" placeholder="sk-or-..." className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', color: 'hsl(0 0% 90%)' }} />
          <button disabled={savingKey} onClick={saveApiKey} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 transition-all" style={{ background: keySaved ? '#10B981' : '#F59E0B', color: keySaved ? 'white' : 'black' }}>
            {savingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : keySaved ? <Check className="w-4 h-4" /> : null}
            {savingKey ? 'Saving...' : keySaved ? 'Saved!' : 'Save Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
