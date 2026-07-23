'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, Bot, CheckCircle2, ImageIcon, Layers3,
  Menu, PenTool, Sparkles, TrendingUp, Video, X, Zap,
} from 'lucide-react';
import { useState } from 'react';

const features = [
  { icon: Bot, title: 'AI specialists', description: 'Purpose-built agents for ideas, scripts, SEO, campaigns, and strategy.', color: '#7a7a7a' },
  { icon: TrendingUp, title: 'Live research', description: 'Ground your content in current conversations, topics, and search intent.', color: '#888888' },
  { icon: PenTool, title: 'Write faster', description: 'Turn a short brief into hooks, scripts, captions, ads, and content calendars.', color: '#f59e0b' },
  { icon: ImageIcon, title: 'Analyze media', description: 'Get practical feedback on composition, lighting, pacing, and your CTA.', color: '#22c55e' },
  { icon: Video, title: 'Improve retention', description: 'Find weak moments and make every second of your video work harder.', color: '#7f7f7f' },
  { icon: Layers3, title: 'Keep brand context', description: 'Use documents and URLs so every response sounds like your brand.', color: '#a6a6a6' },
];

const plans = [
  { name: 'Free', price: '$0', caption: 'For exploring the studio', items: ['50 messages each month', '5 knowledge documents', 'Core AI specialists'], href: '/register' },
  { name: 'Pro', price: '$29', caption: 'For consistent content output', items: ['2,000 messages each month', '100 knowledge documents', 'All specialists & live research'], href: '/register', featured: true },
  { name: 'Agency', price: '$99', caption: 'For teams and client work', items: ['10,000 messages each month', '1,000 knowledge documents', 'Team-ready AI workspace'], href: 'mailto:sales@contentpilot.ai' },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <Link href="/" className="brand" aria-label="ContentPilot AI home">
          <span className="brand-mark"><Sparkles size={19} /></span>
          <span>ContentPilot <em>AI</em></span>
        </Link>
        <div className="landing-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link href="/login">Sign in</Link>
          <Link href="/register" className="button button-small">Start free <ArrowRight size={15} /></Link>
        </div>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
          <Link href="/register" className="button" onClick={() => setMenuOpen(false)}>Start free <ArrowRight size={16} /></Link>
        </div>
      )}

      <section className="hero-section">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="hero-content">
          <div className="eyebrow"><Zap size={15} /> Your content workflow, reimagined</div>
          <h1>Make content that<br /><span>moves people.</span></h1>
          <p>One focused AI studio for the research, writing, strategy, and media feedback behind work people want to share.</p>
          <div className="hero-actions">
            <Link href="/register" className="button button-large">Create for free <ArrowRight size={18} /></Link>
            <a href="#features" className="text-button">Explore the studio <ArrowRight size={17} /></a>
          </div>
          <div className="trust-line"><CheckCircle2 size={16} /> No credit card required <span /> Built for creators and small teams</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="hero-preview" aria-label="Content workflow preview">
          <div className="preview-top"><span className="preview-logo"><Sparkles size={15} /> Content workspace</span><span className="preview-status">Live research on</span></div>
          <div className="preview-body">
            <div className="preview-prompt"><span>✦</span><p>Plan a launch campaign for a new skincare serum</p></div>
            <div className="preview-answer"><div className="answer-icon"><Bot size={17} /></div><div><strong>Campaign strategist</strong><p>I&apos;ve mapped a 7-day launch with four content angles, creator hooks, and a clear conversion path.</p><div className="answer-tags"><span>Launch strategy</span><span>7-day plan</span></div></div></div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="content-section">
        <div className="section-heading"><span>ONE PLACE TO CREATE</span><h2>Everything you need to go from blank page to <em>published work.</em></h2><p>Spend less time jumping between tools and more time making ideas feel unmistakably yours.</p></div>
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
        <div className="section-heading"><span>SIMPLE PRICING</span><h2>Start small. <em>Scale when you&apos;re ready.</em></h2><p>Every plan includes a private workspace built around your content.</p></div>
        <div className="plan-grid">
          {plans.map((plan) => (
            <article className={`plan-card ${plan.featured ? 'plan-featured' : ''}`} key={plan.name}>
              {plan.featured && <span className="plan-badge">Most popular</span>}
              <h3>{plan.name}</h3><p>{plan.caption}</p><div className="plan-price">{plan.price}<small>{plan.price !== '$0' && ' / month'}</small></div>
              <ul>{plan.items.map(item => <li key={item}><CheckCircle2 size={16} /> {item}</li>)}</ul>
              <Link href={plan.href} className={`plan-button ${plan.featured ? 'plan-button-featured' : ''}`}>{plan.name === 'Agency' ? 'Talk to sales' : 'Get started'} <ArrowRight size={16} /></Link>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer"><Link href="/" className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>ContentPilot <em>AI</em></span></Link><p>© {new Date().getFullYear()} ContentPilot AI</p><div><Link href="/login">Sign in</Link><Link href="/register">Create an account</Link></div></footer>
    </main>
  );
}
