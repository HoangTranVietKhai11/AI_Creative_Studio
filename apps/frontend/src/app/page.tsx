'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, Bot, CheckCircle2, ImageIcon, Layers3,
  Menu, PenTool, Sparkles, TrendingUp, Video, X, Zap,
} from 'lucide-react';
import { useState } from 'react';

const features = [
  { icon: Bot, title: 'Chuyên gia AI', description: 'Các đặc vụ AI được thiết kế riêng để lên ý tưởng, kịch bản, SEO, và chiến lược.', color: '#7a7a7a' },
  { icon: TrendingUp, title: 'Nghiên cứu trực tiếp', description: 'Lấy dữ liệu thực tế từ các cuộc thảo luận, chủ đề và xu hướng tìm kiếm mới nhất.', color: '#888888' },
  { icon: PenTool, title: 'Viết nhanh hơn', description: 'Biến một ý tưởng ngắn gọn thành kịch bản, lời tựa, quảng cáo và lịch nội dung.', color: '#f59e0b' },
  { icon: ImageIcon, title: 'Phân tích hình ảnh', description: 'Nhận phản hồi thực tế về bố cục, ánh sáng, nhịp độ và lời kêu gọi hành động.', color: '#22c55e' },
  { icon: Video, title: 'Cải thiện giữ chân', description: 'Tìm ra những khoảnh khắc yếu kém và làm cho từng giây video của bạn cuốn hút hơn.', color: '#7f7f7f' },
  { icon: Layers3, title: 'Giữ vững văn phong', description: 'Sử dụng tài liệu và URL để AI luôn trả lời bằng đúng giọng điệu thương hiệu của bạn.', color: '#a6a6a6' },
];

const plans = [
  { name: 'Miễn phí', price: '$0', caption: 'Khám phá trải nghiệm cơ bản', items: ['50 tin nhắn mỗi tháng', '5 tài liệu kiến thức', 'Các chuyên gia AI cơ bản'], href: '/register' },
  { name: 'Pro', price: '$29', caption: 'Dành cho việc tạo nội dung liên tục', items: ['2,000 tin nhắn mỗi tháng', '100 tài liệu kiến thức', 'Tất cả chuyên gia & nghiên cứu trực tiếp'], href: '/register', featured: true },
  { name: 'Doanh nghiệp', price: '$99', caption: 'Dành cho đội ngũ và khách hàng', items: ['10,000 tin nhắn mỗi tháng', '1,000 tài liệu kiến thức', 'Không gian làm việc cho nhóm'], href: 'mailto:sales@contentpilot.ai' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <Link href="/" className="brand" aria-label="Trang chủ ContentPilot AI">
          <span className="brand-mark"><Sparkles size={19} /></span>
          <span>ContentPilot <em>AI</em></span>
        </Link>
        <div className="landing-links">
          <a href="#features">Tính năng</a>
          <a href="#pricing">Bảng giá</a>
          <Link href="/login">Đăng nhập</Link>
          <Link href="/register" className="button button-small">Bắt đầu miễn phí <ArrowRight size={15} /></Link>
        </div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Bật tắt menu" aria-expanded={menuOpen}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <a href="#features" onClick={() => setMenuOpen(false)}>Tính năng</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Bảng giá</a>
          <Link href="/login" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>
          <Link href="/register" className="button" onClick={() => setMenuOpen(false)}>Bắt đầu miễn phí <ArrowRight size={16} /></Link>
        </div>
      )}

      <section className="hero-section">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="hero-content">
          <div className="eyebrow"><Zap size={15} /> Quy trình sáng tạo nội dung, được định nghĩa lại</div>
          <h1>Tạo ra nội dung<br /><span>chạm đến trái tim.</span></h1>
          <p>Một không gian AI tập trung cho việc nghiên cứu, viết lách, chiến lược và đánh giá truyền thông để tạo ra những tác phẩm mọi người muốn chia sẻ.</p>
          <div className="hero-actions">
            <Link href="/register" className="button button-large">Tạo tài khoản miễn phí <ArrowRight size={18} /></Link>
            <a href="#features" className="text-button">Khám phá không gian <ArrowRight size={17} /></a>
          </div>
          <div className="trust-line"><CheckCircle2 size={16} /> Không cần thẻ tín dụng <span /> Dành cho nhà sáng tạo và đội ngũ nhỏ</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="hero-preview" aria-label="Xem trước quy trình">
          <div className="preview-top"><span className="preview-logo"><Sparkles size={15} /> Không gian làm việc</span><span className="preview-status">Nghiên cứu trực tiếp đang bật</span></div>
          <div className="preview-body">
            <div className="preview-prompt"><span>✦</span><p>Lên kế hoạch chiến dịch ra mắt cho một loại serum dưỡng da mới</p></div>
            <div className="preview-answer"><div className="answer-icon"><Bot size={17} /></div><div><strong>Chuyên gia chiến lược</strong><p>Tôi đã lên bản đồ kế hoạch ra mắt 7 ngày với 4 góc độ nội dung, lời kêu gọi và một lộ trình chuyển đổi rõ ràng.</p><div className="answer-tags"><span>Chiến lược ra mắt</span><span>Kế hoạch 7 ngày</span></div></div></div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="content-section">
        <div className="section-heading"><span>MỘT NƠI DUY NHẤT ĐỂ SÁNG TẠO</span><h2>Mọi thứ bạn cần để đi từ trang giấy trắng đến <em>tác phẩm hoàn chỉnh.</em></h2><p>Dành ít thời gian hơn để chuyển đổi giữa các công cụ và dành nhiều thời gian hơn để biến ý tưởng mang đậm dấu ấn của bạn.</p></div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, description, color }) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon" style={{ color, backgroundColor: `${color}18` }}><Icon size={21} /></span>
              <h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-heading"><span>BẢNG GIÁ ĐƠN GIẢN</span><h2>Bắt đầu từ gói cơ bản. <em>Nâng cấp khi bạn sẵn sàng.</em></h2><p>Mỗi gói đều bao gồm một không gian làm việc riêng tư được xây dựng xung quanh nội dung của bạn.</p></div>
        <div className="plan-grid">
          {plans.map((plan) => (
            <article className={`plan-card ${plan.featured ? 'plan-featured' : ''}`} key={plan.name}>
              {plan.featured && <span className="plan-badge">Phổ biến nhất</span>}
              <h3>{plan.name}</h3><p>{plan.caption}</p><div className="plan-price">{plan.price}<small>{plan.price !== '$0' && ' / tháng'}</small></div>
              <ul>{plan.items.map(item => <li key={item}><CheckCircle2 size={16} /> {item}</li>)}</ul>
              <Link href={plan.href} className={`plan-button ${plan.featured ? 'plan-button-featured' : ''}`}>{plan.name === 'Doanh nghiệp' ? 'Liên hệ kinh doanh' : 'Bắt đầu ngay'} <ArrowRight size={16} /></Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer"><Link href="/" className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>ContentPilot <em>AI</em></span></Link><p>© {new Date().getFullYear()} ContentPilot AI</p><div><Link href="/login">Đăng nhập</Link><Link href="/register">Tạo tài khoản</Link></div></footer>
    </main>
  );
}
