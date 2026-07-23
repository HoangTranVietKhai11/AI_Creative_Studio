'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Zap, ChevronRight } from 'lucide-react';

const agents = [
  {
    name: 'Viết kịch bản',
    icon: 'movie',
    color: '#7a7a7a',
    description: 'Chuyên viết kịch bản cho TikTok, YouTube, Reels. Tạo hook, narrative và CTA mạnh.',
    capabilities: ['Kịch bản video ngắn', 'Hook thu hút', 'Storytelling', 'CTA tối ưu'],
    samplePrompt: 'Viết kịch bản TikTok 60 giây về [chủ đề]',
  },
  {
    name: 'Chuyên gia SEO',
    icon: 'search',
    color: '#10B981',
    description: 'Tối ưu nội dung cho công cụ tìm kiếm. Nghiên cứu từ khóa và lên cấu trúc bài viết.',
    capabilities: ['Phân tích từ khóa', 'Outline bài blog', 'Meta description', 'Internal linking'],
    samplePrompt: 'Tối ưu SEO cho bài viết về [từ khóa]',
  },
  {
    name: 'Nghiên cứu xu hướng',
    icon: 'trending_up',
    color: '#F59E0B',
    description: 'Phân tích xu hướng thị trường real-time. Tìm ra topic đang hot để tạo nội dung kịp thời.',
    capabilities: ['Xu hướng hiện tại', 'Hashtag nổi bật', 'Phân tích đối thủ', 'Cơ hội nội dung'],
    samplePrompt: 'Phân tích xu hướng [ngành] trong tháng này',
  },
  {
    name: 'Chiến lược gia sáng tạo',
    icon: 'lightbulb',
    color: '#888888',
    description: 'Lên chiến lược nội dung dài hạn. Xây dựng brand voice và content calendar toàn diện.',
    capabilities: ['Content strategy', 'Brand positioning', 'Content calendar', 'Campaign planning'],
    samplePrompt: 'Lên chiến lược content 3 tháng cho [brand]',
  },
  {
    name: 'Đạo diễn video',
    icon: 'videocam',
    color: '#a6a6a6',
    description: 'Chỉ đạo sản xuất video chuyên nghiệp. Từ storyboard đến hướng dẫn quay và dựng phim.',
    capabilities: ['Storyboard', 'Shot list', 'Hướng dẫn quay', 'Nhịp cắt'],
    samplePrompt: 'Tạo storyboard cho video [loại nội dung]',
  },
  {
    name: 'Phân tích hình ảnh',
    icon: 'image_search',
    color: '#858585',
    description: 'Phân tích hình ảnh và video. Đưa ra feedback về composition, màu sắc và cách cải thiện.',
    capabilities: ['Phân tích composition', 'Feedback màu sắc', 'Gợi ý cải thiện', 'Brand consistency'],
    samplePrompt: 'Phân tích và đưa ra feedback cho ảnh này',
  },
  {
    name: 'Viết quảng cáo',
    icon: 'edit_note',
    color: '#b8b8b8',
    description: 'Viết copy quảng cáo chuyển đổi cao. Từ headline đến body copy và email marketing.',
    capabilities: ['Ad copy', 'Email marketing', 'Landing page', 'Product description'],
    samplePrompt: 'Viết ad copy cho sản phẩm [tên]',
  },
  {
    name: 'AI Tổng hợp',
    icon: 'auto_awesome',
    color: '#777777',
    description: 'AI đa năng tự động chọn agent phù hợp nhất cho từng yêu cầu của bạn.',
    capabilities: ['Tự động định tuyến', 'Tổng hợp đa nguồn', 'Linh hoạt mọi tác vụ', 'Tối ưu theo context'],
    samplePrompt: 'Bắt đầu cuộc trò chuyện mới',
    isDefault: true,
  },
];

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<typeof agents[0] | null>(null);

  const startChat = (prompt: string) => {
    sessionStorage.setItem('pendingPrompt', prompt);
    window.location.href = '/chat';
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
          <Bot className="w-7 h-7 text-primary" />
          Các đặc vụ AI
        </h1>
        <p className="text-sm text-on-surface-variant">
          Các AI chuyên biệt được tối ưu cho từng loại tác vụ nội dung
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedAgent(selectedAgent?.name === agent.name ? null : agent)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all group ${
              selectedAgent?.name === agent.name
                ? 'bg-surface-container-high border-primary shadow-lg'
                : 'bg-surface border-outline-variant hover:border-primary/50 hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${agent.color}18`, color: agent.color }}
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {agent.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-label-lg text-on-background font-semibold">{agent.name}</h3>
                  {agent.isDefault && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{agent.description}</p>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-outline shrink-0 mt-1 transition-transform ${
                  selectedAgent?.name === agent.name ? 'rotate-90 text-primary' : 'group-hover:text-primary'
                }`}
              />
            </div>

            {/* Expanded section */}
            {selectedAgent?.name === agent.name && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-outline-variant"
              >
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {agent.capabilities.map(cap => (
                    <span key={cap} className="px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant text-xs text-on-surface-variant">
                      {cap}
                    </span>
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); startChat(agent.samplePrompt); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-on-primary transition-colors hover:opacity-90"
                  style={{ background: agent.color }}
                >
                  <Zap className="w-4 h-4" />
                  Dùng ngay: &quot;{agent.samplePrompt}&quot;
                </button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
