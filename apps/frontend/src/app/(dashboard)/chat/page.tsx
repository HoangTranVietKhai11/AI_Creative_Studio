'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api';
import { Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentName?: string;
  sources?: Array<{ title: string; url: string; snippet: string; type: string }>;
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const AGENT_BADGES = [
  { label: 'Viết kịch bản', prompt: 'Viết kịch bản video cho: ' },
  { label: 'Chuyên gia SEO', prompt: 'Tối ưu SEO cho nội dung về: ' },
  { label: 'Nghiên cứu xu hướng', prompt: 'Phân tích xu hướng hiện tại về: ' },
  { label: 'Chiến lược gia sáng tạo', prompt: 'Lên chiến lược content cho: ' },
  { label: 'Đạo diễn video', prompt: 'Tạo storyboard video về: ' },
  { label: 'Phân tích hình ảnh', prompt: 'Phân tích hình ảnh và đưa ra feedback cho: ' },
  { label: 'Viết quảng cáo', prompt: 'Viết copy quảng cáo cho sản phẩm: ' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Conversation history sidebar
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, [input]);

  // Load pending prompt from sessionStorage (from Prompts/Agents pages)
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingPrompt');
    if (pending) {
      setInput(pending);
      sessionStorage.removeItem('pendingPrompt');
      inputRef.current?.focus();
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const data: any = await api.get('/api/chat/conversations');
      setConversations(data.data?.items || data.items || []);
    } catch {
      // Silently fail — sidebar is non-critical
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadConversation = async (conv: Conversation) => {
    try {
      const data: any = await api.get(`/api/chat/conversations/${conv.id}`);
      const msgs: Message[] = (data.data || data).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        agentName: m.agentName,
        sources: m.sources,
        isStreaming: false,
      }));
      setMessages(msgs);
      setConversationId(conv.id);
      setSidebarOpen(false);
      setError(null);
    } catch {
      setError('Không thể tải cuộc trò chuyện này.');
    }
  };

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/chat/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (conversationId === id) {
        startNewChat();
      }
    } catch {
      setError('Không thể xóa cuộc trò chuyện.');
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Create streaming assistant message placeholder
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }]);

    try {
      let token = await api.getValidToken();
      let response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: conversationId || undefined,
        }),
      });

      if (response.status === 401) {
        const refreshed = await api.refreshTokenIfNeeded();
        if (refreshed) {
          token = localStorage.getItem('accessToken');
          response = await fetch(`${API_URL}/api/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: userMessage.content,
              conversationId: conversationId || undefined,
            }),
          });
        }
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Không thể bắt đầu phản hồi. Vui lòng thử lại.');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let sources: Message['sources'] = [];

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

          let json: any;
          try {
            json = JSON.parse(data);
          } catch {
            continue;
          }

          if (json.type === 'conversation' && json.conversationId) {
            setConversationId(json.conversationId);
          }

          if (json.type === 'agent' && json.agentName) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, agentName: json.agentName } : m,
              ),
            );
          }

          if (json.type === 'text' && json.content) {
            fullContent += json.content;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, content: fullContent } : m,
              ),
            );
          }

          if (json.type === 'sources' && json.sources) {
            sources = json.sources;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, sources } : m,
              ),
            );
          }
          if (json.type === 'error') throw new Error(json.content || 'Dịch vụ AI không thể hoàn thành phản hồi.');
        }
      }

      // Mark streaming complete
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, isStreaming: false } : m,
        ),
      );

      // Refresh conversation list to show new/updated entry
      loadConversations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(message);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Xin lỗi, tôi không thể hoàn thành phản hồi đó. Vui lòng thử lại.', isStreaming: false }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (diff < 7 * 86400000) return d.toLocaleDateString('vi-VN', { weekday: 'short' });
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex-1 flex overflow-hidden relative w-full h-full">
      {/* ── Conversation History Sidebar ──── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 z-20 bg-black/40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.28 }}
              className="absolute left-0 top-0 h-full w-72 z-30 flex flex-col bg-surface border-r border-outline-variant shadow-xl md:relative md:z-auto md:shadow-none"
            >
              <div className="flex items-center justify-between p-4 border-b border-outline-variant shrink-0">
                <span className="font-label-lg text-on-background font-semibold">Lịch sử chat</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={startNewChat}
                    title="Chat mới"
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors md:hidden"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 px-3">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-outline" />
                    <p className="text-xs text-on-surface-variant">Chưa có cuộc trò chuyện nào</p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg group transition-colors flex items-start justify-between gap-2 ${
                        conversationId === conv.id
                          ? 'bg-surface-container-high text-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-background'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title || 'Cuộc trò chuyện'}</p>
                        <p className="text-xs text-outline">{formatDate(conv.updatedAt)} · {conv.messageCount} tin</p>
                      </div>
                      <button
                        onClick={(e) => deleteConversation(e, conv.id)}
                        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-outline hover:text-error transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col relative w-full h-full min-w-0">
        {/* Chat toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant bg-surface shrink-0">
          <button
            onClick={() => {
              setSidebarOpen(v => !v);
              if (!sidebarOpen) loadConversations();
            }}
            title="Lịch sử chat"
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <span className="text-sm font-medium text-on-surface-variant">AI Chat</span>
          <div className="flex-1" />
          <button
            onClick={startNewChat}
            title="Chat mới"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-primary border border-outline-variant transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Chat mới
          </button>
        </div>

        {/* Chat Canvas (Scrollable) */}
        <div className="flex-1 overflow-y-auto chat-scroll flex flex-col items-center pt-8 pb-40 px-4 md:px-16 w-full">
          {error && (
            <div className="w-full max-w-3xl mb-4 px-4 py-3 rounded-xl text-sm bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="shrink-0 text-on-error-container/60 hover:text-on-error-container">✕</button>
            </div>
          )}

          {messages.length === 0 ? (
            /* Empty State */
            <div className="w-full max-w-3xl flex flex-col items-center justify-center min-h-[512px]">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>

              <h2 className="font-headline-lg text-[32px] font-semibold text-on-background text-center mb-2">Tôi có thể giúp gì cho bạn hôm nay?</h2>
              <p className="text-sm text-on-surface-variant text-center mb-10 max-w-[500px] w-full">
                Sử dụng các AI Agents chuyên biệt bên dưới hoặc bắt đầu nhập yêu cầu của bạn.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => { setInput('Lên kịch bản chi tiết cho video TikTok 60s giới thiệu sản phẩm công nghệ mới.'); inputRef.current?.focus(); }}
                  className="flex flex-col text-left p-5 rounded-xl border border-outline-variant bg-surface hover:border-primary hover:shadow-[0_4px_12px_rgba(53,37,205,0.08)] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-secondary">movie</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Đạo diễn video</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-background group-hover:text-primary transition-colors">
                    Lên kịch bản chi tiết cho video TikTok 60s giới thiệu sản phẩm công nghệ mới.
                  </span>
                </button>

                <button
                  onClick={() => { setInput('Phân tích 3 xu hướng content marketing nổi bật nhất trong quý này.'); inputRef.current?.focus(); }}
                  className="flex flex-col text-left p-5 rounded-xl border border-outline-variant bg-surface hover:border-primary hover:shadow-[0_4px_12px_rgba(53,37,205,0.08)] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-tertiary-container">trending_up</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nghiên cứu xu hướng</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-background group-hover:text-primary transition-colors">
                    Phân tích 3 xu hướng content marketing nổi bật nhất trong quý này.
                  </span>
                </button>

                <button
                  onClick={() => { setInput('Viết 5 mẫu tiêu đề thu hút cho bài blog hướng dẫn sử dụng AI trong thiết kế UI/UX.'); inputRef.current?.focus(); }}
                  className="flex flex-col text-left p-5 rounded-xl border border-outline-variant bg-surface hover:border-primary hover:shadow-[0_4px_12px_rgba(53,37,205,0.08)] transition-all duration-300 group md:col-span-2"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Viết quảng cáo</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-background group-hover:text-primary transition-colors">
                    Viết 5 mẫu tiêu đề thu hút cho bài blog hướng dẫn sử dụng AI trong thiết kế UI/UX.
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl flex flex-col gap-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0">
                    {message.role === 'user' ? (
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 font-body-md text-body-md text-on-background leading-relaxed">
                    {/* Agent Badge */}
                    {message.agentName && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-primary bg-surface-container-high text-primary font-label-sm text-label-sm mb-2">
                        {message.agentName}
                      </span>
                    )}

                    <div className="markdown-content">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                      {message.isStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 rounded-sm bg-primary animate-pulse" />
                      )}
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.sources.map((source, i) => (
                          <a
                            key={i}
                            href={source.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {source.type === 'web_search' ? 'travel_explore' : 'book'}
                            </span>
                            {source.title.substring(0, 40)}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Fixed Bottom Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-6 pb-6 px-4 md:px-16 z-30 flex flex-col items-center pointer-events-none">
          <div className="w-full max-w-4xl flex flex-col gap-3 pointer-events-auto">
            {/* AI Agent Badges — functional: click sets prompt prefix */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 w-full mask-linear-fade">
              {AGENT_BADGES.map(badge => (
                <button
                  key={badge.label}
                  onClick={() => {
                    setInput(badge.prompt);
                    inputRef.current?.focus();
                    // Position cursor at end
                    setTimeout(() => {
                      const el = inputRef.current;
                      if (el) { el.selectionStart = el.selectionEnd = el.value.length; }
                    }, 0);
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-outline-variant bg-surface text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high hover:border-primary hover:text-primary transition-colors whitespace-nowrap shrink-0"
                >
                  {badge.label}
                </button>
              ))}
              <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-primary bg-surface-container-high text-primary font-label-sm text-label-sm whitespace-nowrap shrink-0">
                AI Tổng hợp
              </span>
            </div>

            {/* Main Input Box */}
            <div className="relative flex items-end bg-surface border border-outline-variant rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 p-2">
              <div className="flex items-center gap-1 p-2 shrink-0">
                <button className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                </button>
              </div>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 max-h-48 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md text-on-background placeholder:text-outline py-3 px-2 overflow-y-auto"
                placeholder="Nhập nội dung yêu cầu của bạn..."
                rows={1}
              />

              <div className="flex items-center gap-2 p-2 shrink-0">
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-full flex items-center justify-center shadow-sm transition-all ${!input.trim() || isLoading ? 'bg-surface-variant text-outline' : 'bg-primary text-on-primary hover:bg-primary-container hover:scale-105'}`}
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  )}
                </button>
              </div>
            </div>

            <div className="text-center">
              <span className="font-label-sm text-[11px] text-outline">AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .mask-linear-fade {
          -webkit-mask-image: linear-gradient(to right, black 95%, transparent 100%);
          mask-image: linear-gradient(to right, black 95%, transparent 100%);
        }
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background-color: #e2e2e2; border-radius: 20px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 {
          font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem;
        }
        .markdown-content ul, .markdown-content ol {
          padding-left: 1.5rem; margin: 0.5rem 0;
        }
        .markdown-content li { margin: 0.25rem 0; }
        .markdown-content p { margin: 0.5rem 0; }
        .markdown-content code {
          background: hsl(0 0% 18%); padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.875em;
        }
        .markdown-content pre {
          background: hsl(0 0% 13%); border: 1px solid hsl(0 0% 18%);
          padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.75rem 0;
        }
        .markdown-content pre code { background: none; padding: 0; }
        .markdown-content strong { font-weight: 600; }
        .markdown-content blockquote {
          border-left: 3px solid hsl(0 0% 30%); padding-left: 1rem; color: hsl(0 0% 60%); margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
