"use client";
import { useState } from "react";

interface SenderAvatarProps {
    avatar: string;
    name: string;
    isDarkMode?: boolean;
    size?: "sm" | "md" | "lg";
    onClick?: (e: React.MouseEvent) => void;
}

export default function SenderAvatar({
    avatar,
    name,
    isDarkMode: dark,
    size = "sm",
    onClick,
}: SenderAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const initials = (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const sizeClass =
        size === "sm" ? "w-6 h-6 text-[9px]" :
            size === "md" ? "w-8 h-8 text-xs" :
                "w-12 h-12 text-sm";
    const clickClass = onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : "";

    if (imgError || !avatar || avatar === "/default-avatar.png") {
        return (
            <div
                className={`${sizeClass} ${clickClass} rounded-full bg-gradient-to-br ${dark ? "from-cyan-600 to-cyan-800 shadow-inner" : "from-cyan-400 to-cyan-600"
                    } flex items-center justify-center font-bold text-white shrink-0`}
                title={name}
                onClick={onClick}
            >
                {initials || "?"}
            </div>
        );
    }

    return (
        <img
            src={avatar}
            alt={name}
            title={name}
            className={`${sizeClass} ${clickClass} rounded-full object-cover shrink-0`}
            onError={() => setImgError(true)}
            onClick={onClick}
        />
    );
}
