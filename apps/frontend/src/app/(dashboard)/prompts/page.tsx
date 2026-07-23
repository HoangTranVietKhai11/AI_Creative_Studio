'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Copy, Check, Star, Plus, X } from 'lucide-react';

const defaultPrompts = [
  {
    id: '1',
    category: 'Video',
    title: 'Kịch bản TikTok Hook',
    prompt: 'Viết 5 câu mở đầu (hook) thu hút cho video TikTok về [chủ đề]. Mỗi hook phải tạo sự tò mò trong 3 giây đầu, phù hợp với audience là [đối tượng] và kết thúc bằng lý do họ phải xem tiếp.',
    tags: ['TikTok', 'Hook', 'Video Script'],
  },
  {
    id: '2',
    category: 'SEO',
    title: 'Blog Post Outline',
    prompt: 'Tạo outline chi tiết cho bài blog về [chủ đề] nhắm đến từ khóa "[từ khóa]". Bao gồm: tiêu đề H1, 5-7 mục H2 kèm H3, câu hỏi FAQ và CTA cuối bài. Tone: [chuyên nghiệp/thân thiện/giáo dục].',
    tags: ['SEO', 'Blog', 'Outline'],
  },
  {
    id: '3',
    category: 'Social',
    title: 'Caption Instagram',
    prompt: 'Viết 3 phiên bản caption Instagram cho ảnh [mô tả ảnh]. Version 1: ngắn gọn ấn tượng (<50 chữ). Version 2: storytelling trung bình (100-150 chữ). Version 3: long-form có giá trị (200+ chữ). Kèm hashtag phù hợp mỗi version.',
    tags: ['Instagram', 'Caption', 'Social Media'],
  },
  {
    id: '4',
    category: 'Ads',
    title: 'Facebook Ad Copy',
    prompt: 'Viết 3 mẫu quảng cáo Facebook cho sản phẩm [tên sản phẩm] giá [giá]. Target: [đối tượng]. Mỗi mẫu có: Headline (tối đa 40 ký tự), Primary text (125 ký tự), Description. Sử dụng framework AIDA.',
    tags: ['Facebook Ads', 'Copywriting', 'AIDA'],
  },
  {
    id: '5',
    category: 'Email',
    title: 'Email Marketing Sequence',
    prompt: 'Tạo chuỗi 5 email marketing chào mừng khách hàng mới cho [loại business]. Email 1: Chào mừng ngay lập tức. Email 2-3 (ngày 2-4): Giá trị và giáo dục. Email 4 (ngày 7): Social proof. Email 5 (ngày 10): Offer đặc biệt. Mỗi email có Subject line và preview text.',
    tags: ['Email', 'Automation', 'Nurture'],
  },
  {
    id: '6',
    category: 'Strategy',
    title: 'Content Calendar 30 ngày',
    prompt: 'Lên kế hoạch content 30 ngày cho brand [ngành nghề] trên nền tảng [platform]. Mỗi tuần có chủ đề riêng. Bao gồm: loại nội dung, chủ đề cụ thể, giờ đăng phù hợp và CTA cho từng bài.',
    tags: ['Strategy', 'Calendar', 'Planning'],
  },
];

const categories = ['Tất cả', 'Video', 'SEO', 'Social', 'Ads', 'Email', 'Strategy'];

export default function PromptsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: '', category: 'Video', prompt: '', tags: '' });

  const filtered = selectedCategory === 'Tất cả'
    ? defaultPrompts
    : defaultPrompts.filter(p => p.category === selectedCategory);

  const copyPrompt = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const usePrompt = (text: string) => {
    sessionStorage.setItem('pendingPrompt', text);
    window.location.href = '/chat';
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
            <Terminal className="w-7 h-7 text-secondary" />
            Thư viện Prompt
          </h1>
          <p className="text-sm text-on-surface-variant">Prompt templates chất lượng cao, sẵn sàng sử dụng</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md hover:bg-primary-container transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm prompt
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-label-sm text-label-sm transition-all border ${
              selectedCategory === cat
                ? 'bg-primary text-on-primary border-primary'
                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary bg-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-2xl bg-surface border border-outline-variant hover:border-primary/40 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1 block">
                  {p.category}
                </span>
                <h3 className="font-label-lg text-on-background font-semibold">{p.title}</h3>
              </div>
              <Star className="w-4 h-4 text-outline group-hover:text-tertiary transition-colors mt-1" />
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-3">
              {p.prompt}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-surface-container-low border border-outline-variant text-xs text-on-surface-variant">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => usePrompt(p.prompt)}
                className="flex-1 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-colors"
              >
                Dùng ngay
              </button>
              <button
                onClick={() => copyPrompt(p.id, p.prompt)}
                className="px-3 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
              >
                {copiedId === p.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Prompt Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-surface border border-outline-variant shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-on-background">Thêm Prompt mới</h2>
                <button onClick={() => setShowAdd(false)} className="p-1 text-on-surface-variant hover:text-on-background">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={newPrompt.title}
                  onChange={e => setNewPrompt(p => ({ ...p, title: e.target.value }))}
                  placeholder="Tên prompt"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-background placeholder:text-outline text-sm focus:outline-none focus:border-primary"
                />
                <select
                  value={newPrompt.category}
                  onChange={e => setNewPrompt(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-background text-sm focus:outline-none focus:border-primary"
                >
                  {['Video', 'SEO', 'Social', 'Ads', 'Email', 'Strategy'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <textarea
                  value={newPrompt.prompt}
                  onChange={e => setNewPrompt(p => ({ ...p, prompt: e.target.value }))}
                  placeholder="Nội dung prompt..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-background placeholder:text-outline text-sm focus:outline-none focus:border-primary resize-none"
                />
                <input
                  value={newPrompt.tags}
                  onChange={e => setNewPrompt(p => ({ ...p, tags: e.target.value }))}
                  placeholder="Tags (phân cách bằng dấu phẩy)"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-background placeholder:text-outline text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-background transition-colors">
                  Hủy
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-colors"
                >
                  Lưu Prompt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
