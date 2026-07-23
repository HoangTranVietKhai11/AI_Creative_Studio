'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, Upload, Loader2, Eye, CheckCircle2, Clock, XCircle, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

interface MediaItem {
  id: string;
  type: string;
  filename: string;
  analysisStatus: string;
  analysisResult: Record<string, unknown> | null;
  createdAt: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { loadMedia(); }, []);

  const loadMedia = async () => {
    try {
      const data: any = await api.get('/api/media');
      setMedia(data.data?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thư viện media');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true);
    setError('');
    const errs: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await api.upload('/api/media/upload', formData);
      } catch (err) {
        errs.push(`Lỗi tải lên ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    setUploading(false);
    if (errs.length > 0) setError(errs.join('\n'));
    loadMedia();
  }, []);

  const deleteMedia = async (id: string) => {
    try {
      await api.delete(`/api/media/${id}`);
      if (selectedMedia?.id === id) setSelectedMedia(null);
      loadMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa media');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'video/*': ['.mp4', '.webm', '.mov'] },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ImageIcon className="w-7 h-7" style={{ color: '#F59E0B' }} />
          Media Analysis
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(0 0% 55%)' }}>
          Upload images and videos for AI-powered analysis
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-start justify-between">
          <span className="text-sm whitespace-pre-wrap">{error}</span>
          <button onClick={() => setError('')} className="hover:opacity-70 mt-0.5">✕</button>
        </div>
      )}

      <div
        {...getRootProps()}
        className="p-12 rounded-2xl text-center cursor-pointer mb-8"
        style={{
          background: isDragActive ? 'hsl(0 0% 50% / 0.05)' : 'hsl(0 0% 11%)',
          border: isDragActive ? '2px dashed #F59E0B' : '2px dashed hsl(0 0% 20%)',
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin" style={{ color: '#F59E0B' }} />
        ) : (
          <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: 'hsl(0 0% 40%)' }} />
        )}
        <p className="font-medium mb-1">{isDragActive ? 'Drop media here' : 'Upload images or videos'}</p>
        <p className="text-sm" style={{ color: 'hsl(0 0% 45%)' }}>JPG, PNG, WebP, MP4, WebM — up to 100MB</p>
      </div>

      {/* Analysis Detail Modal */}
      {selectedMedia && selectedMedia.analysisResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedMedia(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 rounded-2xl" style={{ background: 'hsl(0 0% 11%)', border: '1px solid hsl(0 0% 18%)' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Analysis: {selectedMedia.filename}</h2>
            <div className="markdown-content text-sm" style={{ color: 'hsl(0 0% 75%)' }}>
              <pre className="whitespace-pre-wrap">{(selectedMedia.analysisResult as any).rawAnalysis || JSON.stringify(selectedMedia.analysisResult, null, 2)}</pre>
            </div>
            <button onClick={() => setSelectedMedia(null)} className="mt-4 px-4 py-2 rounded-lg text-sm" style={{ background: '#777777', color: 'white' }}>Close</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#777777' }} /></div>
      ) : media.length === 0 ? (
        <div className="text-center py-12"><ImageIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(0 0% 30%)' }} /><p style={{ color: 'hsl(0 0% 45%)' }}>No media uploaded yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map(item => (
            <div key={item.id} className="p-4 rounded-xl" style={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 18%)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate">{item.filename}</span>
                {item.analysisStatus === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} /> :
                 item.analysisStatus === 'FAILED' ? <XCircle className="w-4 h-4" style={{ color: '#EF4444' }} /> :
                 <Clock className="w-4 h-4 animate-spin" style={{ color: '#F59E0B' }} />}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(0 0% 45%)' }}>
                <span className="px-2 py-0.5 rounded-full" style={{ background: 'hsl(0 0% 18%)' }}>{item.type}</span>
                <div className="ml-auto flex items-center gap-3">
                  {item.analysisStatus === 'COMPLETED' && (
                    <button onClick={() => setSelectedMedia(item)} className="flex items-center gap-1 hover:text-indigo-400 transition-colors" style={{ color: '#777777' }}>
                      <Eye className="w-3 h-3" /> View Analysis
                    </button>
                  )}
                  <button onClick={() => deleteMedia(item.id)} className="p-1 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
