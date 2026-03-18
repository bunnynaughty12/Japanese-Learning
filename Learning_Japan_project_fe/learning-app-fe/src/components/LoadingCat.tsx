import React from "react";

interface LoadingCatProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  subMessage?: string;
  showText?: boolean;
  showProgressBar?: boolean;
  isDark?: boolean;
  className?: string;
}

const LoadingCat: React.FC<LoadingCatProps> = ({
  size = "md",
  message = "Đang tải",
  subMessage = "Vui lòng đợi trong giây lát",
  showText = true,
  showProgressBar = true,
  isDark = false,
  className = "",
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      cat: "w-16 h-16",
      dust: "w-1.5 h-1.5",
      text: "text-base",
      subText: "text-xs",
      progress: "w-32 h-1",
      gap: "gap-3",
    },
    md: {
      cat: "w-24 h-24",
      dust: "w-2 h-2",
      text: "text-xl",
      subText: "text-xs",
      progress: "w-48 h-1.5",
      gap: "gap-4",
    },
    lg: {
      cat: "w-28 h-28",
      dust: "w-2.5 h-2.5",
      text: "text-2xl",
      subText: "text-sm",
      progress: "w-56 h-2",
      gap: "gap-5",
    },
    xl: {
      cat: "w-32 h-32",
      dust: "w-3 h-3",
      text: "text-3xl",
      subText: "text-base",
      progress: "w-64 h-2",
      gap: "gap-6",
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`flex flex-col items-center justify-center ${config.gap} ${className}`}
    >
      {/* Cute Cat Image Animation */}
      <div className="relative">
        <div className="animate-bounce">
          <img
            src="/cat-load.png"
            alt="Loading cat"
            className={`${config.cat} object-contain drop-shadow-2xl`}
          />
        </div>

        {/* Running effect - dust clouds */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
          <div
            className={`${config.dust} ${
              isDark ? "bg-cyan-400" : "bg-cyan-400"
            } rounded-full animate-ping`}
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className={`${config.dust} ${
              isDark ? "bg-cyan-400" : "bg-cyan-400"
            } rounded-full animate-ping`}
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className={`${config.dust} ${
              isDark ? "bg-cyan-400" : "bg-cyan-400"
            } rounded-full animate-ping`}
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>

      {/* Loading text */}
      {showText && (
        <div className="text-center">
          <h3
            className={`${
              config.text
            } font-bold mb-1 flex items-center gap-2 justify-center ${
              isDark ? "text-white" : "text-cyan-600"
            }`}
          >
            {message}
            <span className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0s" }}>
                .
              </span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "0.2s" }}
              >
                .
              </span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "0.4s" }}
              >
                .
              </span>
            </span>
          </h3>
          <p
            className={`${config.subText} ${
              isDark ? "text-cyan-200" : "text-gray-500"
            }`}
          >
            {subMessage}
          </p>
        </div>
      )}

      {/* Progress bar */}
      {showProgressBar && (
        <div
          className={`${config.progress} ${
            isDark ? "bg-gray-700" : "bg-gray-200"
          } rounded-full overflow-hidden`}
        >
          <div
            className={`h-full bg-gradient-to-r ${
              isDark ? "from-cyan-400 to-cyan-500" : "from-cyan-400 to-cyan-500"
            } rounded-full animate-pulse`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default LoadingCat;
