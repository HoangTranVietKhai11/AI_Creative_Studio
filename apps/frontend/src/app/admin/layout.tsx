'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { Menu, X, ArrowLeft } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Tổng quan', icon: 'dashboard' },
  { href: '/admin/users', label: 'Người dùng', icon: 'group' },
];

export default function AdminLayout({
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
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'ADMIN') {
        router.push('/chat'); // Redirect normal users
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = () => setShowUserMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showUserMenu]);

  if (isLoading || (isAuthenticated && user?.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          <p className="text-on-surface-variant font-label-md">Đang xác thực...</p>
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
          <div className="w-8 h-8 rounded bg-error flex items-center justify-center text-on-error">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-error truncate">Admin Panel</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Hệ thống quản trị</p>
          </div>
        </div>
        <button
          className="md:hidden p-1 rounded-md text-on-surface-variant"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
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
        <Link
          href="/chat"
          className="w-full flex items-center gap-3 px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-lg duration-200 ease-in-out"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-label-md text-label-md">Về trang chủ</span>
        </Link>
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
          <div className="w-6 h-6 rounded bg-error flex items-center justify-center text-on-error">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          </div>
          <span className="font-bold text-lg text-error">Admin</span>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm"
            />
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
          <div className="flex items-center gap-6 h-full">
            <div className="h-full flex items-center text-error border-b-2 border-error font-label-md">
              <span className="flex items-center gap-1">
                Khu vực Quản trị (Admin)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
                      <p className="font-label-md text-on-background truncate">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                      Cài đặt cá nhân
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
