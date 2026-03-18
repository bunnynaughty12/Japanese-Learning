"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    Loader2,
    Volume2,
    BookOpen,
    Filter,
    Trash
} from "lucide-react";
import { vocabService, VocabResponse } from "@/services/vocabService";
import { LearningStatus } from "@/enums/LearningStatus";

interface VocabularyListProps {
    isDarkMode: boolean;
}

export default function VocabularyList({ isDarkMode }: VocabularyListProps) {
    const [vocabs, setVocabs] = useState<VocabResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadVocabs();
    }, []);

    const loadVocabs = async () => {
        try {
            setIsLoading(true);
            const data = await vocabService.getMyVocabs();
            setVocabs(data);
        } catch (err) {
            console.error("Failed to load vocabs", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (surface: string, id: string) => {
        if (!confirm(`Bạn có chắc muốn xóa từ "${surface}"?`)) return;

        try {
            setIsActionLoading(id);
            await vocabService.remove(surface);
            setVocabs(prev => prev.filter(v => v.id !== id));
        } catch (err) {
            console.error("Delete failed", err);
            alert("Xóa thất bại. Vui lòng thử lại.");
        } finally {
            setIsActionLoading(null);
        }
    };

    const startEdit = (vocab: VocabResponse) => {
        setEditingId(vocab.id);
        setEditValue(vocab.translated);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue("");
    };

    const saveEdit = async (vocab: VocabResponse) => {
        if (!editValue.trim() || editValue === vocab.translated) {
            cancelEdit();
            return;
        }

        try {
            setIsActionLoading(vocab.id);
            await vocabService.updateMeaning({
                surface: vocab.surface,
                translated: editValue.trim()
            });
            setVocabs(prev => prev.map(v =>
                v.id === vocab.id ? { ...v, translated: editValue.trim() } : v
            ));
            setEditingId(null);
        } catch (err) {
            console.error("Update failed", err);
            alert("Cập nhật thất bại.");
        } finally {
            setIsActionLoading(null);
        }
    };

    const playSound = (surface: string, audioUrl?: string) => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play().catch(e => console.error(e));
        } else {
            const utterance = new SpeechSynthesisUtterance(surface);
            utterance.lang = "ja-JP";
            window.speechSynthesis.speak(utterance);
        }
    };

    const filteredVocabs = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return vocabs;
        return vocabs.filter(v =>
            v.surface.toLowerCase().includes(query) ||
            v.translated.toLowerCase().includes(query) ||
            v.reading?.toLowerCase().includes(query)
        );
    }, [vocabs, searchQuery]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
                <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Đang tải danh sách từ vựng...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-2">
            {/* Search Bar */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm từ vựng, ý nghĩa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 rounded-2xl outline-none transition-all ${isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-cyan-500/50"
                                : "bg-white border-gray-200 text-gray-800 shadow-sm focus:ring-2 focus:ring-cyan-500/20"
                            } border`}
                    />
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold ${isDarkMode ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-600"
                    }`}>
                    Tổng cộng: {filteredVocabs.length} từ
                </div>
            </div>

            {/* List Container */}
            <div className="space-y-4">
                {filteredVocabs.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>Không tìm thấy từ vựng nào</p>
                    </div>
                ) : (
                    filteredVocabs.map((v) => (
                        <div
                            key={v.id}
                            className={`group flex flex-col md:flex-row items-start md:items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${isDarkMode
                                    ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800 hover:border-gray-600 shadow-black/20"
                                    : "bg-white border-gray-100 hover:shadow-xl hover:shadow-cyan-500/5 hover:border-cyan-100"
                                }`}
                        >
                            {/* Surface & Reading */}
                            <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                                        {v.surface}
                                    </h3>
                                    <button
                                        onClick={() => playSound(v.surface, v.audioUrl)}
                                        className="p-1.5 rounded-full hover:bg-cyan-500/10 text-cyan-500 transition"
                                    >
                                        <Volume2 size={16} />
                                    </button>
                                    {v.status === LearningStatus.KNOWN && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            ĐÃ THUỘC
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs opacity-60">
                                    <span className={isDarkMode ? "text-gray-300" : "text-gray-500"}>
                                        {v.reading || v.romaji}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-gray-500/10 uppercase tracking-wider">
                                        {v.partOfSpeech}
                                    </span>
                                </div>
                            </div>

                            {/* Meaning (Editable) */}
                            <div className="flex-[2] w-full">
                                {editingId === v.id ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveEdit(v);
                                                if (e.key === "Escape") cancelEdit();
                                            }}
                                            className={`flex-1 px-3 py-2 rounded-lg border outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                                                }`}
                                        />
                                        <button
                                            onClick={() => saveEdit(v)}
                                            disabled={isActionLoading === v.id}
                                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <p className={`text-lg font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                                        {v.translated}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 ml-auto">
                                {editingId !== v.id && (
                                    <>
                                        <button
                                            onClick={() => startEdit(v)}
                                            className="p-2.5 rounded-xl hover:bg-cyan-500/10 text-cyan-500 transition"
                                            title="Sửa nghĩa"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(v.surface, v.id)}
                                            disabled={isActionLoading === v.id}
                                            className="p-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition"
                                            title="Xóa từ"
                                        >
                                            {isActionLoading === v.id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={18} />
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
