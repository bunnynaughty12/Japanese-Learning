"use client";
import React, { useEffect, useState } from "react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { kanjiService, KanjiResponse } from "@/services/kanjiService";
import { Languages, Loader2, Plus, Search, BookOpen, Layers } from "lucide-react";

export default function AdminKanjiPage() {
    const { isDarkMode: isDark } = useDarkMode();
    const [kanjis, setKanjis] = useState<KanjiResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Create form state
    const [newCharacter, setNewCharacter] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const fetchKanjis = async () => {
        setIsLoading(true);
        try {
            const data = await kanjiService.getAll();
            // Sort by character or ID (descending)
            setKanjis(data.sort((a, b) => b.id.localeCompare(a.id)));
        } catch (error) {
            console.error("Failed to fetch kanjis:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKanjis();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCharacter.trim()) return;

        setIsCreating(true);
        try {
            await kanjiService.create({ character: newCharacter.trim() });
            setNewCharacter("");
            await fetchKanjis();
            alert("Tạo Kanji thành công!");
        } catch (error: any) {
            console.error("Failed to create kanji:", error);
            alert(error.message || "Không thể tạo Kanji");
        } finally {
            setIsCreating(false);
        }
    };

    const filteredKanjis = kanjis.filter(k =>
        k.character.includes(searchQuery) ||
        k.meaning?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                    <Languages className={`w-8 h-8 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                    Quản lý Kanji
                </h1>
                <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Thêm mới Hán tự vào hệ thống bằng cách nhập mặt chữ.
                </p>
            </div>

            {/* Create Section */}
            <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                <h3 className={`text-sm font-bold mb-4 uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Thêm Kanji Mới
                </h3>
                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Nhập chữ Hán (ví dụ: 水, 曜)..."
                            value={newCharacter}
                            onChange={(e) => setNewCharacter(e.target.value)}
                            maxLength={1}
                            className={`w-full pl-4 pr-10 py-3 rounded-xl border text-sm outline-none transition ${isDark
                                ? "bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-indigo-500/50"
                                : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-2 focus:ring-indigo-500/20"
                                }`}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isCreating || !newCharacter.trim()}
                        className={`px-8 py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 ${isCreating || !newCharacter.trim()
                            ? "bg-gray-500 cursor-not-allowed opacity-50"
                            : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                    >
                        {isCreating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Tạo Kanji
                    </button>
                </form>
            </div>

            {/* List Section */}
            <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                        <h3 className={`font-bold uppercase tracking-wider text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                            Danh sách Kanji ({filteredKanjis.length})
                        </h3>
                    </div>

                    {/* Search bar */}
                    <div className="relative w-full sm:w-64">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm kanji..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border outline-none transition ${isDark
                                ? "bg-gray-800 border-gray-700 text-white focus:border-indigo-500"
                                : "bg-white border-gray-200 text-gray-900 focus:border-indigo-400"
                                }`}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    </div>
                ) : filteredKanjis.length === 0 ? (
                    <div className={`text-center py-20 rounded-3xl border border-dashed ${isDark ? "border-gray-700 bg-gray-800/50 text-gray-500" : "border-gray-200 bg-white text-gray-400"}`}>
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Không tìm thấy Kanji nào.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredKanjis.map((kanji) => (
                            <div
                                key={kanji.id}
                                className={`p-5 rounded-2xl border transition-all hover:shadow-md group ${isDark ? "bg-gray-800 border-gray-700 hover:border-indigo-500/50" : "bg-white border-gray-100 hover:border-indigo-300"}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className={`text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                        {kanji.character}
                                    </div>
                                    <div className={`p-2 rounded-lg ${isDark ? "bg-gray-700 text-gray-400" : "bg-gray-50 text-gray-400"}`}>
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div className="space-y-1">
                                        <div className={`text-[10px] font-bold uppercase tracking-tighter ${isDark ? "text-gray-500" : "text-gray-400"}`}>Ý nghĩa</div>
                                        <div className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                            {kanji.meaning || "Chưa cập nhật"}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <div className={`text-[10px] font-bold uppercase tracking-tighter ${isDark ? "text-gray-500" : "text-gray-400"}`}>Onyomi</div>
                                            <div className={`text-xs font-medium ${isDark ? "text-indigo-300" : "text-indigo-600"}`}>
                                                {kanji.onyomi || "—"}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className={`text-[10px] font-bold uppercase tracking-tighter ${isDark ? "text-gray-500" : "text-gray-400"}`}>Kunyomi</div>
                                            <div className={`text-xs font-medium ${isDark ? "text-teal-300" : "text-teal-600"}`}>
                                                {kanji.kunyomi || "—"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center gap-2">
                                        <Layers className={`w-3 h-3 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                                        <span className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                            {kanji.svgStrokes?.length || 0} nét vẽ
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
