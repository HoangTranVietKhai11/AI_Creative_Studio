'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Plus, X, Crown, Zap } from 'lucide-react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  provider: string;
  createdAt: string;
  subscription?: {
    plan: 'FREE' | 'PRO' | 'AGENCY';
    status: string;
  };
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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    plan: 'FREE'
  });
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO' | 'AGENCY'>('FREE');

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingId('create');
    try {
      await api.post('/api/admin/users', formData);
      setIsCreateModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'USER', plan: 'FREE' });
      fetchUsers(1); // Reload to show new user
      alert('Tạo người dùng thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo người dùng');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser) return;
    setUpdatingId(selectedUser.id);
    try {
      await api.put(`/api/admin/users/${selectedUser.id}/subscription`, { plan: selectedPlan });
      setUsers(users.map(u => u.id === selectedUser.id ? { 
        ...u, 
        subscription: { plan: selectedPlan, status: 'ACTIVE' } 
      } : u));
      setIsPlanModalOpen(false);
      alert('Cập nhật gói cước thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật gói cước');
    } finally {
      setUpdatingId(null);
    }
  };

  const openPlanModal = (user: User) => {
    setSelectedUser(user);
    setSelectedPlan(user.subscription?.plan || 'FREE');
    setIsPlanModalOpen(true);
  };

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'AGENCY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 text-purple-500 rounded-md text-xs font-bold"><Crown className="w-3.5 h-3.5" /> AGENCY</span>;
      case 'PRO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-md text-xs font-bold"><Zap className="w-3.5 h-3.5" /> PRO</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-high text-on-surface-variant rounded-md text-xs font-bold">FREE</span>;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col h-full">
        <header className="mb-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold font-headline-lg text-on-background">Quản lý Người dùng</h1>
            <p className="text-on-surface-variant mt-2 font-body-md">
              Xem và phân quyền cho tất cả thành viên trên hệ thống.
            </p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Thêm thành viên
          </button>
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
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-surface-container-low sticky top-0 z-10 border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant">Thành viên</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant">Nguồn</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant">Ngày tham gia</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant">Phân quyền</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant">Gói cước</th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-12 bg-surface-container-low rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
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
                      <td className="px-6 py-4">
                        {getPlanBadge(u.subscription?.plan)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={updatingId === u.id}
                            onClick={() => openPlanModal(u)}
                            className="text-sm font-label-sm px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors"
                          >
                            Đổi gói
                          </button>

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
                            className="text-sm font-label-sm px-3 py-1.5 rounded-lg border border-error/20 text-error hover:bg-error hover:text-white transition-colors bg-error/10"
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

      {/* CREATE USER MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-md rounded-2xl border border-outline-variant shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-outline-variant">
                <h2 className="text-xl font-bold text-on-surface">Thêm thành viên mới</h2>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-4 md:p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên hiển thị</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email đăng nhập</label>
                  <input 
                    type="email" 
                    required
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="VD: nguyen@example.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu ban đầu</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Nhập mật khẩu cho người dùng"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phân quyền</label>
                    <select 
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 outline-none"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="USER">USER (Cơ bản)</option>
                      <option value="ADMIN">ADMIN (Quản trị)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gói cước</label>
                    <select 
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 outline-none"
                      value={formData.plan}
                      onChange={e => setFormData({...formData, plan: e.target.value})}
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="AGENCY">AGENCY</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    disabled={updatingId === 'create'}
                    className="btn btn-primary px-6"
                  >
                    {updatingId === 'create' ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHANGE PLAN MODAL */}
      <AnimatePresence>
        {isPlanModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-sm rounded-2xl border border-outline-variant shadow-xl overflow-hidden"
            >
              <div className="p-4 md:p-6 border-b border-outline-variant">
                <h2 className="text-xl font-bold text-on-surface">Đổi gói cước</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Đang thao tác cho: <span className="font-bold text-on-surface">{selectedUser.email}</span>
                </p>
              </div>
              <div className="p-4 md:p-6 flex flex-col gap-4">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors">
                  <input type="radio" name="plan" checked={selectedPlan === 'FREE'} onChange={() => setSelectedPlan('FREE')} />
                  <div>
                    <p className="font-bold">Gói FREE</p>
                    <p className="text-xs text-on-surface-variant">Quyền lợi cơ bản</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors">
                  <input type="radio" name="plan" checked={selectedPlan === 'PRO'} onChange={() => setSelectedPlan('PRO')} />
                  <div>
                    <p className="font-bold text-blue-500 flex items-center gap-1"><Zap className="w-4 h-4"/> Gói PRO</p>
                    <p className="text-xs text-on-surface-variant">Tăng tốc độ, hỗ trợ đầy đủ AI</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10 transition-colors">
                  <input type="radio" name="plan" checked={selectedPlan === 'AGENCY'} onChange={() => setSelectedPlan('AGENCY')} />
                  <div>
                    <p className="font-bold text-purple-500 flex items-center gap-1"><Crown className="w-4 h-4"/> Gói AGENCY</p>
                    <p className="text-xs text-on-surface-variant">Sử dụng không giới hạn</p>
                  </div>
                </label>
                
                <div className="mt-4 flex justify-end gap-3">
                  <button 
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low rounded-xl"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleUpdatePlan}
                    disabled={updatingId === selectedUser.id}
                    className="btn btn-primary px-6"
                  >
                    {updatingId === selectedUser.id ? 'Đang lưu...' : 'Xác nhận'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
