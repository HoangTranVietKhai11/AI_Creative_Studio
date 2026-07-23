'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  BookOpen, Upload, Trash2, Loader2,
  FileText, Globe, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  fileSize: number | null;
  chunkCount: number | null;
  errorMsg: string | null;
  createdAt: string;
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    try {
      const data: any = await api.get('/api/knowledge/documents');
      setDocuments(data.data?.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách tài liệu');
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
      formData.append('title', file.name);
      try {
        await api.upload('/api/knowledge/upload', formData);
      } catch (err) {
        errs.push(`Lỗi tải lên ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    setUploading(false);
    if (errs.length > 0) setError(errs.join('\n'));
    loadDocuments();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv'],
    },
  });

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    try {
      setError('');
      await api.post('/api/knowledge/scrape', { url: scrapeUrl });
      setScrapeUrl('');
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể scrape URL');
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await api.delete(`/api/knowledge/documents/${id}`);
      loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa tài liệu');
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />;
      case 'FAILED': return <XCircle className="w-4 h-4" style={{ color: '#EF4444' }} />;
      default: return <Clock className="w-4 h-4 animate-spin" style={{ color: '#F59E0B' }} />;
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BookOpen className="w-7 h-7" style={{ color: '#10B981' }} />
          Knowledge Base
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(0 0% 55%)' }}>
          Upload documents and URLs to enrich AI responses with your brand context
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-start justify-between">
          <span className="text-sm whitespace-pre-wrap">{error}</span>
          <button onClick={() => setError('')} className="hover:opacity-70 mt-0.5">✕</button>
        </div>
      )}

      {/* Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          {...getRootProps()}
          className="p-8 rounded-2xl text-center cursor-pointer transition-all"
          style={{
            background: isDragActive ? 'hsl(0 0% 66% / 0.05)' : 'hsl(0 0% 11%)',
            border: isDragActive ? '2px dashed #777777' : '2px dashed hsl(0 0% 20%)',
          }}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin" style={{ color: '#777777' }} />
          ) : (
            <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(0 0% 40%)' }} />
          )}
          <p className="font-medium mb-1">
            {isDragActive ? 'Drop files here' : 'Drag & drop files'}
          </p>
          <p className="text-sm" style={{ color: 'hsl(0 0% 45%)' }}>
            PDF, DOCX, TXT, MD, CSV — up to 50MB
          </p>
        </div>

        <div
          className="p-8 rounded-2xl flex flex-col justify-center"
          style={{ background: 'hsl(0 0% 11%)', border: '1px solid hsl(0 0% 18%)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5" style={{ color: '#a6a6a6' }} />
            <h3 className="font-semibold">Scrape URL</h3>
          </div>
          <div className="flex gap-2">
            <input
              value={scrapeUrl}
              onChange={e => setScrapeUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'hsl(0 0% 8%)', border: '1px solid hsl(0 0% 20%)', color: 'hsl(0 0% 90%)' }}
            />
            <button onClick={handleScrape} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: '#a6a6a6', color: 'white' }}>
              Scrape
            </button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#777777' }} />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(0 0% 30%)' }} />
            <p style={{ color: 'hsl(0 0% 45%)' }}>No documents yet. Upload files or scrape URLs above.</p>
          </div>
        ) : (
          documents.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'hsl(0 0% 13%)', border: '1px solid hsl(0 0% 18%)' }}
            >
              <div className="flex items-center gap-3">
                {statusIcon(doc.status)}
                <div>
                  <p className="text-sm font-medium">{doc.title}</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'hsl(0 0% 45%)' }}>
                    <span>{doc.type}</span>
                    {doc.fileSize && <span>{formatSize(doc.fileSize)}</span>}
                    {doc.chunkCount && <span>{doc.chunkCount} chunks</span>}
                    {doc.errorMsg && <span style={{ color: '#EF4444' }}>{doc.errorMsg}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteDocument(doc.id)} className="p-1.5 rounded-lg" style={{ color: 'hsl(0 0% 45%)' }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
