"use client";
import { useEffect, useState } from "react";
import { userService, UserProfileResponse } from "@/services/userService";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import LoadingCat from "@/components/LoadingCat";
import { useDarkMode } from "@/hooks/useDarkMode";
import { getAccessTokenFromStorage, getRolesFromToken } from "@/utils/jwt";
import { JLPTLevel } from "@/enums/JLPTLevel";
import { toast } from "@/components/ui/Toast";

// ── Components chính ──
import ProfileSideCard from "@/components/profile/Profilesidecard";
import ProfileInfoCard from "@/components/profile/Profileinfocard";
import LearningStats from "@/components/profile/Learningstats";
import SkillAnalysisCard from "@/components/profile/Skillanalysiscard";
import JLPTRoadmapCard from "@/components/profile/Jlptroadmapcard";
import VocabProgressCard from "@/components/profile/Vocabprogresscard";
import BillingHistoryCard from "@/components/profile/BillingHistoryCard";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", level: JLPTLevel.N5 as JLPTLevel });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(4);
  const { isDarkMode, toggleDarkMode, mounted } = useDarkMode();
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.isPremium || user.roles?.includes("USER_VIP")) {
        setIsVip(true);
      } else {
        const token = getAccessTokenFromStorage();
        if (token) {
          const roles = getRolesFromToken(token);
          setIsVip(roles.includes("USER_VIP"));
        }
      }
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const userData = await userService.getProfile();
        if (userData) {
          setUser(userData);
          setFormData({
            fullName: userData.fullName || "",
            email: userData.email || "",
            level: userData.level || JLPTLevel.N5,
          });
        }
      } catch (error) {
        console.error("Lỗi tải profile:", error);
      }
    };
    load();
  }, []);

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      await userService.uploadAvatar(file);
      const updated = await userService.getProfile();
      setUser(updated);
    } catch {
      toast.error("Lỗi upload ảnh", "Không thể tải ảnh đại diện lên. Vui lòng thử lại.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveInfo = async () => {
    try {
      const updatedUser = await userService.updateProfile({
        fullName: formData.fullName,
        level: formData.level,
      });
      setUser(updatedUser);
      toast.success("Cập nhật thành công!", "Thông tin cá nhân đã được lưu.");
      setIsEditing(false);
    } catch {
      toast.error("Lỗi cập nhật", "Không thể lưu thông tin. Vui lòng thử lại.");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPassword = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.warning("Thiếu thông tin", "Vui lòng nhập đầy đủ các trường mật khẩu.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.warning("Không khớp", "Mật khẩu mới và xác nhận mật khẩu không trùng nhau!");
      return;
    }
    try {
      await userService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      toast.success("Đổi mật khẩu thành công!", "Vui lòng đăng nhập lại với mật khẩu mới.");
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      console.error(error);
      const isAxiosError = (
        err: unknown
      ): err is { response?: { status?: number } } =>
        typeof err === "object" && err !== null && "response" in err;
      if (isAxiosError(error) && error.response?.status === 400) {
        toast.error("Sai mật khẩu", "Mật khẩu hiện tại không đúng!");
      } else {
        toast.error("Đổi mật khẩu thất bại", "Vui lòng thử lại sau.");
      }
    }
  };

  if (!mounted)
    return (
      <div className="flex h-screen bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <LoadingCat
            size="xl"
            isDark={true}
            message="Đang tải"
            subMessage="Vui lòng đợi trong giây lát"
          />
        </div>
      </div>
    );

  if (!user)
    return (
      <div
        className={`flex h-screen ${isDarkMode
          ? "bg-gray-900"
          : isVip
            ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"
            : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
          }`}
      >
        <div className="flex-1 flex items-center justify-center">
          <LoadingCat
            size="lg"
            isDark={isDarkMode}
            message="Đang tải hồ sơ"
            subMessage="Vui lòng đợi trong giây lát"
          />
        </div>
      </div>
    );

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      <div
        className={`flex h-screen ${isDarkMode
          ? "bg-gray-900"
          : isVip
            ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50"
            : "bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50"
          }`}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDarkMode={isDarkMode}
          currentStreak={currentStreak}
          onStreakUpdate={setCurrentStreak}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative z-0">
          <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

          <div
            className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar"
              }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
              {/* Cột trái */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <ProfileSideCard
                  user={user}
                  isDark={isDarkMode}
                  onUploadAvatar={handleUploadAvatar}
                />
                <SkillAnalysisCard isDark={isDarkMode} />
                <JLPTRoadmapCard isDark={isDarkMode} />
                <VocabProgressCard isDark={isDarkMode} />{" "}
                {/* ✅ nằm dưới JLPTRoadmapCard */}
              </div>

              {/* Cột phải */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <ProfileInfoCard
                  user={user}
                  isDark={isDarkMode}
                  formData={formData}
                  isEditing={isEditing}
                  passwordForm={passwordForm}
                  showPasswordModal={showPasswordModal}
                  onInputChange={handleInputChange}
                  onSave={handleSaveInfo}
                  onCancelEdit={() => {
                    setIsEditing(false);
                    setFormData({
                      fullName: user.fullName || "",
                      email: user.email || "",
                      level: user.level || JLPTLevel.N5,
                    });
                  }}
                  onStartEdit={() => setIsEditing(true)}
                  onOpenPasswordModal={() => setShowPasswordModal(true)}
                  onClosePasswordModal={() => setShowPasswordModal(false)}
                  onPasswordChange={handlePasswordChange}
                  onSubmitPassword={handleSubmitPassword}
                />
                <BillingHistoryCard isDark={isDarkMode} />
                <LearningStats isDark={isDarkMode} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
