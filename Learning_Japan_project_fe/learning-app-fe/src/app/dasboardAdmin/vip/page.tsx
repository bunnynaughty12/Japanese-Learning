"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
    Crown,
    Loader2,
    Calendar,
    Zap,
    CheckCircle2,
    XCircle,
    Sparkles,
    ShieldCheck,
    Clock,
    Edit3,
    Trash2,
    AlertTriangle
} from "lucide-react";
import { vipService, VipPackageResponse, PlanType, CreateVipPackageRequest } from "@/services/vipService";

const PLAN_TYPE_CONFIG: Record<PlanType, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    MONTHLY: {
        label: "Tháng",
        bg: "bg-blue-500 dark:bg-blue-600",
        text: "text-white dark:text-blue-50",
        icon: <Clock className="w-4 h-4" />
    },
    YEARLY: {
        label: "Năm",
        bg: "bg-purple-500 dark:bg-purple-600",
        text: "text-white dark:text-purple-50",
        icon: <Sparkles className="w-4 h-4" />
    },
    LIFETIME: {
        label: "Vĩnh viễn",
        bg: "bg-amber-500 dark:bg-amber-600",
        text: "text-white dark:text-amber-50",
        icon: <Zap className="w-4 h-4" />
    }
};

export default function AdminVipManagementPage() {
    const router = useRouter();
    const { isDarkMode: isDark } = useDarkMode();
    const [packages, setPackages] = useState<VipPackageResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<CreateVipPackageRequest & { id?: string }>({
        planType: "MONTHLY",
        name: "",
        price: 0,
        durationDays: 30,
        active: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const data = await vipService.getAll();
            setPackages(data || []);
        } catch (error) {
            console.error("Failed to load VIP packages:", error);
        } finally {
            setLoading(false);
        }
    };

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });
    const [notification, setNotification] = useState<{ show: boolean, type: 'success' | 'error', message: string }>({ show: false, type: 'success', message: '' });

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    };

    const confirmDelete = (id: string, name: string) => {
        setDeleteModal({ isOpen: true, id, name });
    }

    const executeDelete = async () => {
        const { id, name } = deleteModal;
        try {
            await vipService.delete(id);
            setPackages(packages.filter(p => p.id !== id));
            showNotification('success', `Đã xóa gói "${name}" thành công.`);
        } catch (error: any) {
            console.error("Failed to delete VIP package:", error);
            showNotification('error', error.response?.data?.message || "Có lỗi xảy ra khi xóa gói VIP.");
        } finally {
            setDeleteModal({ isOpen: false, id: '', name: '' });
        }
    }

    const openEditModal = (pkg: VipPackageResponse) => {
        setEditForm({
            id: pkg.id,
            name: pkg.name,
            price: pkg.price,
            planType: pkg.planType,
            durationDays: pkg.durationDays || 30,
            active: pkg.active
        });
        setError(null);
        setEditModalOpen(true);
    }

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;

        if (name === "planType") {
            const plan = value as PlanType;
            let defaultDays = 30;
            if (plan === "YEARLY") defaultDays = 365;
            if (plan === "LIFETIME") defaultDays = 36500;

            setEditForm(prev => ({ ...prev, planType: plan, durationDays: defaultDays }));
            return;
        }

        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setEditForm(prev => ({ ...prev, [name]: checked }));
        } else if (type === "number") {
            setEditForm(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setEditForm(prev => ({ ...prev, [name]: value }));
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.id) return;
        setError(null);

        if (!editForm.name.trim()) {
            setError("Tên gói VIP không được để trống.");
            return;
        }
        if (editForm.price < 0) {
            setError("Giá tiền không được âm.");
            return;
        }

        try {
            setIsSaving(true);
            await vipService.update(editForm.id, {
                name: editForm.name,
                planType: editForm.planType,
                price: editForm.price,
                durationDays: editForm.durationDays,
                active: editForm.active
            } as CreateVipPackageRequest);
            setEditModalOpen(false);
            showNotification('success', "Cập nhật gói thành công.");
            fetchPackages();
        } catch (err: any) {
            console.error("Failed to update VIP package:", err);
            setError(err.response?.data?.message || "Đã xảy ra lỗi khi cập nhật.");
        } finally {
            setIsSaving(false);
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
    };

    return (
        <main className="p-8 space-y-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <Crown className={`w-8 h-8 ${isDark ? "text-amber-400" : "text-amber-500"}`} />
                        Quản lý Gói VIP
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Xem và quản lý các gói thành viên VIP cho hệ thống.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`rounded-3xl p-6 border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Crown className="w-6 h-6" />
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>Tổng số Gói</p>
                            <p className="text-2xl font-black">{packages.length}</p>
                        </div>
                    </div>
                </div>

                <div className={`rounded-3xl p-6 border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>Đang hoạt động</p>
                            <p className="text-2xl font-black">{packages.filter(p => p.active).length}</p>
                        </div>
                    </div>
                </div>

                <div className={`rounded-3xl p-6 border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>Tính năng</p>
                            <p className="text-2xl font-black">Ưu tiên</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className={`text-sm font-medium animate-pulse ${isDark ? "text-gray-500" : "text-gray-400"}`}>Đang đồng bộ dữ liệu VIP...</p>
                </div>
            ) : packages.length === 0 ? (
                <div className={`py-40 text-center rounded-[32px] border-2 border-dashed ${isDark ? "border-gray-800 bg-gray-800/20" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex flex-col items-center">
                        <div className="p-4 rounded-full bg-indigo-500/5 mb-4">
                            <Crown className="w-12 h-12 text-indigo-500 opacity-20" />
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Chưa có gói VIP nào</h3>
                        <p className={`text-sm mb-8 max-w-xs mx-auto ${isDark ? "text-gray-500" : "text-gray-400"}`}>Hệ thống chưa có gói VIP nào được cấu hình.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {packages.map((pkg) => {
                        const typeConfig = PLAN_TYPE_CONFIG[pkg.planType];
                        return (
                            <div
                                key={pkg.id}
                                className={`group rounded-[32px] border p-6 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? "bg-gray-800 border-gray-700 hover:border-amber-500/30" : "bg-white border-gray-100 hover:border-amber-200"}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${typeConfig.bg} ${typeConfig.text}`}>
                                        {typeConfig.icon}
                                        {typeConfig.label}
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${pkg.active ? "bg-emerald-500 text-white dark:bg-emerald-600 dark:text-emerald-50" : "bg-gray-500 text-white dark:bg-gray-600 dark:text-gray-50"}`}>
                                        {pkg.active ? (
                                            <><CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động</>
                                        ) : (
                                            <><XCircle className="w-3.5 h-3.5" /> Đã ẩn</>
                                        )}
                                    </div>
                                </div>

                                <h3 className={`text-xl font-black mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                                    {pkg.name}
                                </h3>

                                <div className="flex items-baseline gap-1 mt-2 mb-6">
                                    <span className={`text-2xl font-black ${isDark ? "text-amber-400" : "text-amber-500"}`}>
                                        {formatCurrency(pkg.price)}
                                    </span>
                                    <span className={`text-xs font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                        / {pkg.planType === "LIFETIME" ? "trọn đời" : pkg.durationDays ? `${pkg.durationDays} ngày` : pkg.planType}
                                    </span>
                                </div>

                                <div className={`mt-auto pt-6 border-t flex flex-col gap-3 ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                                    <div className="flex justify-between items-center">
                                        <div className={`flex items-center gap-2 text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                            <Calendar className="w-4 h-4 opacity-50" />
                                            Thời gian: {pkg.durationDays ? `${pkg.durationDays} ngày` : "Vô thời hạn"}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(pkg)}
                                                className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-gray-700 text-indigo-400" : "hover:bg-gray-100 text-indigo-600"}`}
                                                title="Sửa"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(pkg.id, pkg.name)}
                                                className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-gray-700 text-red-400" : "hover:bg-red-50 text-red-600"}`}
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className={`p-6 border-b flex justify-between items-center ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                                <Edit3 className="w-5 h-5 text-indigo-500" />
                                Cập nhật Gói VIP
                            </h2>
                            <button onClick={() => setEditModalOpen(false)} className={`p-1 rounded-full ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 text-sm rounded-xl bg-red-50 text-red-600 border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className={`block text-sm font-bold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Tên Gói VIP <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-bold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Loại Gói <span className="text-red-500">*</span></label>
                                    <select
                                        name="planType"
                                        value={editForm.planType}
                                        onChange={handleEditChange}
                                        className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                    >
                                        <option value="MONTHLY">Hàng tháng</option>
                                        <option value="YEARLY">Hàng năm</option>
                                        <option value="LIFETIME">Trọn đời</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-sm font-bold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Thời hạn (Ngày)</label>
                                    <input
                                        type="number"
                                        name="durationDays"
                                        value={editForm.durationDays || 0}
                                        onChange={handleEditChange}
                                        className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-bold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Giá tiền (VNĐ) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="price"
                                    value={editForm.price}
                                    onChange={handleEditChange}
                                    className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl mt-4 border bg-indigo-50/10 border-indigo-100 dark:border-indigo-500/20">
                                <div>
                                    <p className={`font-bold text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}>Đang hoạt động</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="active"
                                        checked={editForm.active}
                                        onChange={handleEditChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                                </label>
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${isSaving ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30"}`}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 animate-in slide-in-from-top-4 ${notification.type === 'success'
                    ? (isDark ? "bg-emerald-900/90 text-emerald-100 border border-emerald-800" : "bg-emerald-50 text-emerald-800 border border-emerald-200")
                    : (isDark ? "bg-red-900/90 text-red-100 border border-red-800" : "bg-red-50 text-red-800 border border-red-200")
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <p className="font-bold text-sm tracking-wide">{notification.message}</p>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-6 text-center transform transition-all ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className={`text-xl font-black mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Xác nhận xóa</h3>
                        <p className={`text-sm mb-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Bạn có chắc chắn muốn xóa gói <strong className={isDark ? "text-gray-200" : "text-gray-700"}>"{deleteModal.name}"</strong>? Thao tác này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
                                className={`flex-1 px-5 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
                            >
                                Xóa ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
