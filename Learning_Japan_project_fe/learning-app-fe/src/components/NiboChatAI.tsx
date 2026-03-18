"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Loader2 } from "lucide-react";
import { chatbotService } from "@/services/chatbotService";
import { getAccessTokenFromStorage, getRolesFromToken } from "@/utils/jwt";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MaziAIChatProps {
  isDarkMode?: boolean;
}

export default function MaziAIChat({ isDarkMode = false }: MaziAIChatProps) {
  const [isVip, setIsVip] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là NIBO AI. Tôi có thể giúp gì cho bạn?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (token) {
      const roles = getRolesFromToken(token);
      setIsVip(roles.includes("USER_VIP"));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isVip) {
      scrollToBottom();
    }
  }, [messages, isVip]);

  if (!isVip) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatbotService.chat({
        message: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[9999]">
        {/* Chat Button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative transition-all duration-300 hover:scale-110"
          >
            {/* Cat Icon with Bounce Animation */}
            <div className="relative w-11 h-11 drop-shadow-2xl animate-bounce-slow">
              <img
                src="/logo-cat.png"
                alt="NIBO AI"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Pulse Effect - Updated to cyan */}
            <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-20 animate-ping" />
          </button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div
            className={`${isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-2xl shadow-2xl w-96 h-[600px] flex flex-col overflow-hidden ${isDarkMode ? "border-gray-700" : "border-gray-200"
              } border animate-slide-up`}
          >
            {/* Header - Updated to cyan gradient */}
            <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1 animate-bounce-slow">
                  <img
                    src="/logo-cat.png"
                    alt="NIBO AI"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold">NIBO AI</h3>
                  <p className="text-xs text-cyan-50">Trợ lý AI thông minh</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-cyan-600 rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"
                }`}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                    } animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === "user"
                      ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-br-none shadow-md"
                      : `${isDarkMode
                        ? "bg-gray-800 text-gray-100 border-gray-700"
                        : "bg-white text-gray-800 border-gray-200"
                      } shadow-sm rounded-bl-none border`
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div
                    className={`${isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                      } text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border`}
                  >
                    <Loader2 className="animate-spin text-cyan-500" size={20} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className={`p-4 ${isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
                } border-t`}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className={`flex-1 px-4 py-2 ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900"
                    } border rounded-full focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all`}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-full p-2 transition-all disabled:cursor-not-allowed flex-shrink-0 shadow-md hover:shadow-lg"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
