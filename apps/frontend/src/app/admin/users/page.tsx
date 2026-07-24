'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  provider: string;
  createdAt: string;
}

interface PaginatedResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse['meta'] | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async (p: number) => {
    setIsLoading(true);
    try {
      const res = await api.get<PaginatedResponse>(`/api/admin/users?page=${p}&pageSize=10`);
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    if (!confirm(`Bạn có chắc chắn muốn chuyển người dùng này thành ${newRole}?`)) return;
    
    setUpdatingId(userId);
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật quyền');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    const action = newStatus === 'SUSPENDED' ? 'KHÓA' : 'MỞ KHÓA';
    if (!confirm(`Bạn có chắc chắn muốn ${action} người dùng này?`)) return;
    
    setUpdatingId(userId);
    try {
      await api.put(`/api/admin/users/${userId}/status`, { status: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('CẢNH BÁO: Hành động này sẽ XÓA VĨNH VIỄN người dùng và toàn bộ dữ liệu của họ. Bạn có chắc chắn?')) return;
    
    setUpdatingId(userId);
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      setMeta(prev => prev ? { ...prev, total: prev.total - 1 } : null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa người dùng');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
        <header className="mb-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold font-headline-lg text-on-background">Quản lý Người dùng</h1>
            <p className="text-on-surface-variant mt-2 font-body-md">
              Xem và phân quyền cho tất cả thành viên trên hệ thống.
            </p>
          </div>
        </header>

        {error && (
          <div className="p-4 mb-6 bg-error-container/20 text-error rounded-xl border border-error/20 flex items-center gap-3 shrink-0">
            <span className="material-symbols-outlined">error</span>
            <p>{error}</p>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 bg-surface border border-outline-variant rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low sticky top-0 z-10 border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant">Thành viên</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant">Nguồn</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant">Ngày tham gia</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant">Phân quyền</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-12 bg-surface-container-low rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                      Không tìm thấy người dùng nào.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <motion.tr 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      key={u.id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-label-md text-on-surface">
                              {u.name || 'Người dùng'}
                              {u.status === 'SUSPENDED' && (
                                <span className="ml-2 px-1.5 py-0.5 bg-error/10 text-error text-[10px] rounded uppercase font-bold tracking-wider">
                                  Bị khóa
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-on-surface-variant">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-surface-container-high rounded-md text-xs font-medium text-on-surface-variant">
                          {u.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-error/10 text-error rounded-md text-xs font-bold">
                            <ShieldAlert className="w-3.5 h-3.5" /> ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" /> USER
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={updatingId === u.id}
                            onClick={() => handleRoleChange(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                            className={`text-sm font-label-sm px-3 py-1.5 rounded-lg border transition-colors ${
                              u.role === 'ADMIN' 
                                ? 'border-primary/20 text-primary hover:bg-primary/10' 
                                : 'border-outline-variant text-on-surface hover:bg-surface-container-low'
                            }`}
                          >
                            {updatingId === u.id ? '...' : (u.role === 'ADMIN' ? 'Hạ quyền' : 'Lên Admin')}
                          </button>

                          <button
                            disabled={updatingId === u.id}
                            onClick={() => handleStatusChange(u.id, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            className={`text-sm font-label-sm px-3 py-1.5 rounded-lg border transition-colors ${
                              u.status === 'ACTIVE' 
                                ? 'border-outline-variant text-on-surface hover:bg-surface-container-low'
                                : 'border-error/20 text-error hover:bg-error/10'
                            }`}
                          >
                            {updatingId === u.id ? '...' : (u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa')}
                          </button>

                          <button
                            disabled={updatingId === u.id}
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-sm font-label-sm px-3 py-1.5 rounded-lg border border-error/20 text-error hover:bg-error text-white hover:text-white transition-colors bg-error/10"
                            title="Xóa vĩnh viễn"
                          >
                            <span className="material-symbols-outlined text-[18px] block">delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest shrink-0">
              <p className="text-sm text-on-surface-variant">
                Trang {meta.page} / {meta.totalPages} (Tổng {meta.total} user)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  disabled={page === meta.totalPages || isLoading}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
