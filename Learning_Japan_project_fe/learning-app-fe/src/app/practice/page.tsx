"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Clock, Users } from "lucide-react";
import {
  examService,
  ExamResponse,
  StartExamResponse,
} from "@/services/examService";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import { useDarkMode } from "@/hooks/useDarkMode";

interface ExamCardProps {
  id: string;
  title: string;
  duration: number;
  participants: number;
  sections: number;
  questions: number;
  isDark: boolean;
}

const ExamCard: React.FC<ExamCardProps> = ({
  id,
  title,
  duration,
  participants,
  sections,
  questions,
  isDark,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartExam = async () => {
    setLoading(true);
    try {
      const res: StartExamResponse = await examService.startExam({
        examId: id,
      });

      router.push(
        `/exam?examId=${res.examId}` +
        `&participantId=${res.participantId}` +
        `&duration=${res.duration}` +
        `&section=1`
      );
    } catch (err) {
      console.error("Lỗi khi bắt đầu bài thi:", err);
      alert("Không thể bắt đầu bài thi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${isDark
        ? "bg-gray-800 border-gray-700"
        : "bg-white/90 backdrop-blur-sm border-cyan-100"
        } rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border`}
    >
      <h3
        className={`text-lg font-bold mb-4 ${isDark ? "text-gray-100" : "text-gray-800"
          }`}
      >
        {title}
      </h3>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-500" />
          <span
            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            {duration} phút
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-500" />
          {participants > 0 && (
            <span
              className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"
                }`}
            >
              {participants} người đã thi
            </span>
          )}
        </div>

        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {sections} phần thi | {questions} câu hỏi
        </p>
      </div>

      <button
        onClick={handleStartExam}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? "Đang bắt đầu..." : "Bắt đầu thi"}
      </button>
    </div>
  );
};

export default function PracticePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState("N1");
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(3);

  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const levels = ["N1", "N2", "N3", "N4", "N5"];

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examService.getAll();
        setExams(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải đề thi");
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filteredExams = exams.filter(
    (exam) =>
      exam.level === activeLevel &&
      exam.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div
        className={`flex h-screen ${isDarkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
          }`}
      >
        {/* Sidebar Component */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* HEADER */}
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Level Tabs */}
              <div className="flex gap-3 mb-6">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setActiveLevel(level)}
                    className={`px-6 py-3 rounded-xl font-semibold transition transform hover:scale-105 ${activeLevel === level
                      ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg"
                      : isDarkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                        : "bg-white text-gray-700 hover:bg-cyan-50 border border-cyan-200"
                      }`}
                  >
                    JLPT {level}
                  </button>
                ))}
              </div>

              {/* Search */}
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm đề thi..."
                className={`mb-6 px-4 py-3 ${isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-cyan-200 text-gray-700"
                  } border-2 rounded-xl w-full max-w-md focus:outline-none focus:ring-2 focus:ring-cyan-400 transition`}
              />

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
                    <p
                      className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                      Đang tải đề thi...
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-center py-8">
                  <p
                    className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                  >
                    Không thể tải đề thi
                  </p>
                  <p className={isDarkMode ? "text-gray-400" : "text-red-500"}>
                    {error}
                  </p>
                </div>
              )}

              {/* Exam Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    id={exam.id}
                    title={exam.code}
                    duration={exam.duration}
                    participants={exam.participant ?? 0}
                    sections={exam.numSections}
                    questions={exam.numQuestions}
                    isDark={isDarkMode}
                  />
                ))}
              </div>

              {/* Empty */}
              {!loading && filteredExams.length === 0 && (
                <p
                  className={`text-center mt-10 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                  Không có đề thi phù hợp
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
