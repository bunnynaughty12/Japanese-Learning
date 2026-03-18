"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  label?: string; // Text hiển thị, default "Trở về"
  to?: string; // Link muốn chuyển tới, nếu có
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  label = "Trở về",
  to,
  className,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (to) {
      router.push(to); // chuyển tới link cụ thể nếu có
    } else {
      router.back(); // không có link thì quay lại trang trước
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 transition ${
        className || ""
      }`}
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
};

export default BackButton;
