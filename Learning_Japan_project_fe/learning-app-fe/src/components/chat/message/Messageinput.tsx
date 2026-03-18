"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Send,
  Smile,
  Paperclip,
  Image as ImageIcon,
  File,
  X,
} from "lucide-react";

interface AttachmentPreview {
  file: File;
  preview: string;
  type: "image" | "file";
}

interface MessageInputProps {
  message: string;
  isConnected: boolean;
  isDarkMode: boolean;
  showEmojiPicker: boolean;
  attachmentPreview: AttachmentPreview | null;
  emojis: string[];
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onEmojiClick: (emoji: string) => void;
  onToggleEmojiPicker: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAttachment: () => void;
}

export default function MessageInput({
  message,
  isConnected,
  isDarkMode,
  showEmojiPicker,
  attachmentPreview,
  emojis,
  onMessageChange,
  onSendMessage,
  onKeyPress,
  onEmojiClick,
  onToggleEmojiPicker,
  onFileSelect,
  onClearAttachment,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Local multi-image state (paste / drag-drop)
  const [localImages, setLocalImages] = useState<AttachmentPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // ── helpers ───────────────────────────────────────────────────────────────
  const addImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    setLocalImages((prev) => [...prev, { file, preview, type: "image" }]);
  }, []);

  const removeLocalImage = useCallback((index: number) => {
    setLocalImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearAll = useCallback(() => {
    setLocalImages((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });
    onClearAttachment();
  }, [onClearAttachment]);

  // ── Paste ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isConnected) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      let hasImage = false;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            addImageFile(file);
            hasImage = true;
          }
        }
      }
      if (hasImage) e.preventDefault();
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isConnected, addImageFile]);

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node))
      setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isConnected) return;
    Array.from(e.dataTransfer.files).forEach((f) => addImageFile(f));
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = () => {
    // Flush local images through parent's onFileSelect one by one
    localImages.forEach((img) => {
      const dt = new DataTransfer();
      dt.items.add(img.file);
      onFileSelect({
        target: { files: dt.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });
    setLocalImages([]);
    onSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend();
    } else {
      onKeyPress(e);
    }
  };

  const hasContent =
    message.trim() || attachmentPreview || localImages.length > 0;

  return (
    <div
      className={`border-t shadow-lg transition-colors duration-300 relative ${
        isDarkMode
          ? "bg-gray-800/95 border-gray-700"
          : "bg-white/95 border-cyan-200/60"
      } ${isDragging ? "ring-2 ring-inset ring-cyan-400" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none ${
            isDarkMode ? "bg-gray-900/80" : "bg-cyan-50/90"
          }`}
        >
          <ImageIcon
            className={`w-10 h-10 mb-2 ${
              isDarkMode ? "text-cyan-400" : "text-cyan-500"
            }`}
          />
          <p
            className={`text-sm font-semibold ${
              isDarkMode ? "text-cyan-300" : "text-cyan-600"
            }`}
          >
            Thả ảnh vào đây để gửi
          </p>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          Array.from(e.target.files || []).forEach(addImageFile);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelect}
      />

      {/* Image preview strip */}
      {(localImages.length > 0 || attachmentPreview) && (
        <div className="px-4 pt-3 flex items-end gap-2 flex-wrap">
          {localImages.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img.preview}
                alt={`img-${i}`}
                className="w-20 h-20 object-cover rounded-xl border-2 border-cyan-400 shadow-md"
              />
              <button
                onClick={() => removeLocalImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {attachmentPreview && (
            <div className="relative group">
              {attachmentPreview.type === "image" ? (
                <img
                  src={attachmentPreview.preview}
                  alt="preview"
                  className="w-20 h-20 object-cover rounded-xl border-2 border-blue-400 shadow-md"
                />
              ) : (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-cyan-50 border-cyan-200 text-cyan-900"
                  }`}
                >
                  <File className="w-5 h-5 shrink-0" />
                  <span className="text-xs max-w-[120px] truncate">
                    {attachmentPreview.file.name}
                  </span>
                </div>
              )}
              <button
                onClick={onClearAttachment}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {(localImages.length > 1 ||
            (localImages.length > 0 && attachmentPreview)) && (
            <button
              onClick={clearAll}
              className={`text-xs px-2 py-1 rounded-lg self-center transition-colors ${
                isDarkMode
                  ? "text-gray-400 hover:text-red-400 hover:bg-gray-700"
                  : "text-cyan-500 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              Xóa tất cả
            </button>
          )}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          className={`absolute bottom-20 left-4 rounded-xl shadow-2xl border p-4 max-h-64 overflow-y-auto w-80 z-50 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-cyan-200"
          }`}
        >
          <div className="grid grid-cols-8 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => onEmojiClick(emoji)}
                className={`text-2xl rounded p-1 transition-colors ${
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-cyan-50"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onToggleEmojiPicker}
          className={`p-2.5 rounded-full transition-all hover:scale-110 shrink-0 ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-cyan-100"
          }`}
        >
          <Smile
            className={`w-5 h-5 ${
              isDarkMode ? "text-cyan-400" : "text-cyan-600"
            }`}
          />
        </button>

        <button
          onClick={() => imageInputRef.current?.click()}
          title="Chọn ảnh (hoặc paste / kéo thả)"
          className={`p-2.5 rounded-full transition-all hover:scale-110 shrink-0 ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-cyan-100"
          }`}
        >
          <ImageIcon
            className={`w-5 h-5 ${
              isDarkMode ? "text-cyan-400" : "text-cyan-600"
            }`}
          />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-full transition-all hover:scale-110 shrink-0 ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-cyan-100"
          }`}
        >
          <Paperclip
            className={`w-5 h-5 ${
              isDarkMode ? "text-cyan-400" : "text-cyan-600"
            }`}
          />
        </button>

        <input
          type="text"
          placeholder={
            isConnected
              ? "Nhập tin nhắn... (Paste hoặc kéo thả ảnh)"
              : "Đang kết nối đến chat..."
          }
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          className={`flex-1 px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-cyan-500/40 focus:border-cyan-500/40"
              : "bg-cyan-50/50 border-cyan-200/60 text-gray-900 placeholder-cyan-400 focus:ring-cyan-500/40 focus:border-cyan-500/40"
          }`}
        />

        <button
          onClick={handleSend}
          disabled={!hasContent || !isConnected}
          className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full transition-all hover:scale-110 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
