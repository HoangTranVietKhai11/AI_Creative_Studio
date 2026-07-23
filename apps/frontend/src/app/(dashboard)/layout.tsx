'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { Menu, X } from 'lucide-react';

const navItems = [
  { href: '/chat', label: 'AI Chat', icon: 'chat_spark' },
  { href: '/projects', label: 'Dự án', icon: 'folder_open' },
  { href: '/knowledge', label: 'Kho kiến thức', icon: 'database' },
  { href: '/media', label: 'Phân tích ảnh/video', icon: 'video_search' },
  { href: '/trends', label: 'Xu hướng', icon: 'trending_up' },
  { href: '/prompts', label: 'Thư viện Prompt', icon: 'terminal' },
  { href: '/agents', label: 'AI Agents', icon: 'smart_toy' },
  { href: '/billing', label: 'Thanh toán', icon: 'payments' },
  { href: '/settings', label: 'Cài đặt', icon: 'settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, loadUser, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = () => setShowUserMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showUserMenu]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
          <p className="text-on-surface-variant font-label-md">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-3 mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary truncate">ContentPilot AI</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">AI Workspace</p>
          </div>
        </div>
        <button
          className="md:hidden p-1 rounded-md text-on-surface-variant"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* CTA Button — navigate to /chat (new conversation) */}
      <Link
        href="/chat"
        onClick={() => setIsMobileMenuOpen(false)}
        className="w-full mb-6 py-2.5 px-4 bg-primary text-on-primary rounded-lg font-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Tạo mới
      </Link>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out ${
                isActive
                  ? 'bg-surface-container-high text-primary font-medium'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-label-md">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Tab */}
      <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-lg duration-200 ease-in-out"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-label-md text-label-md">Đăng xuất</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-background font-body-md antialiased">
      {/* ── Mobile Header ───────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b flex items-center px-4 justify-between z-40 bg-surface border-outline-variant">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
          </div>
          <span className="font-bold text-lg text-primary">ContentPilot</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-on-surface-variant">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* ── Desktop Sidebar ───────────────────────── */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full flex-col p-4 bg-surface border-r border-outline-variant w-64 z-50">
        <SidebarContent />
      </nav>

      {/* ── Mobile Sidebar Drawer ───────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 flex flex-col p-4 bg-surface border-r border-outline-variant md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ──────────────────── */}
      <main className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden relative w-full bg-background">
        {/* TopNavBar */}
        <header className="hidden md:flex sticky top-0 z-40 justify-between items-center h-14 px-8 w-full bg-surface border-b border-outline-variant shrink-0">
          {/* Left: Current page label */}
          <div className="flex items-center gap-6 h-full">
            <a className="h-full flex items-center text-on-surface-variant hover:text-primary transition-colors font-label-md" href="#">
              Workspace
            </a>
            {/* Static model indicator — non-interactive, will be upgraded later */}
            <div className="h-full flex items-center text-primary border-b-2 border-primary font-label-md">
              <span className="flex items-center gap-1">
                AI Tổng hợp
              </span>
            </div>
          </div>
          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/billing"
              className="py-1.5 px-4 bg-surface border border-outline-variant text-on-surface font-label-sm rounded-lg hover:bg-surface-container-low transition-colors scale-95 active:scale-100"
            >
              Nâng cấp
            </Link>
            {/* User avatar with dropdown menu */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(v => !v); }}
                className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant overflow-hidden scale-95 active:scale-100 flex items-center justify-center font-bold text-on-surface hover:border-primary transition-colors"
              >
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-52 rounded-xl bg-surface border border-outline-variant shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-outline-variant">
                      <p className="font-label-md text-on-background truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                      Cài đặt
                    </Link>
                    <button
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error-container/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Mobile header spacer */}
        <div className="md:hidden h-14 flex-shrink-0" />

        {children}

      </main>
    </div>
  );
}
