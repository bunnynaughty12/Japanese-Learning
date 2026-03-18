import { Notification } from "@/types/notification";
import { Check, Settings, Trash2, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";
import { friendService } from "@/services/friendService";
import { roomService } from "@/services/roomService";
import { Loader2, UserPlus } from "lucide-react";
import { FriendRequestResponse } from "@/services/friendService";
import SenderAvatar from "./chat/floating/SenderAvatar";

type Props = {
  notifications: Notification[];
  pendingFriendRequests?: FriendRequestResponse[];
  isDarkMode?: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onDismissFriendRequest?: (requestId: string) => void;
};

export default function NotificationDropdown({
  notifications,
  pendingFriendRequests = [],
  isDarkMode = false,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDismissFriendRequest,
}: Props) {
  const bgColor = isDarkMode ? "bg-gray-800" : "bg-white";
  const textColor = isDarkMode ? "text-gray-100" : "text-gray-900";
  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
  const hoverBg = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <div
      className={`absolute right-0 top-full mt-2 w-96 rounded-lg shadow-2xl border ${bgColor} ${borderColor} z-50 max-h-[600px] flex flex-col`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${borderColor} flex items-center justify-between`}
      >
        <h3 className={`text-xl font-bold ${textColor}`}>Thông báo</h3>
        <div className="flex items-center gap-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className={`p-2 rounded-lg ${hoverBg} transition-colors`}
              title="Đánh dấu tất cả đã đọc"
            >
              <Check
                className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
              />
            </button>
          )}
          <button
            className={`p-2 rounded-lg ${hoverBg} transition-colors`}
            title="Cài đặt"
          >
            <Settings
              className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
            />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {pendingFriendRequests.map(request => (
          <FriendRequestItem
            key={request.requestId}
            request={request}
            isDarkMode={isDarkMode}
            onDismiss={() => onDismissFriendRequest?.(request.requestId)}
          />
        ))}

        {notifications.length === 0 && pendingFriendRequests.length === 0 ? (
          <div className="p-8 text-center">
            <Bell
              className={`w-16 h-16 mx-auto mb-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"
                }`}
            />
            <p
              className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
            >
              Bạn không có thông báo nào
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isDarkMode={isDarkMode}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Component cho mỗi notification item
function NotificationItem({
  notification,
  isDarkMode,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  isDarkMode: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const hoverBg = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const unreadBg = isDarkMode ? "bg-blue-900/30" : "bg-blue-50";
  const textColor = isDarkMode ? "text-gray-100" : "text-gray-900";
  const mutedColor = isDarkMode ? "text-gray-400" : "text-gray-500";

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div
      className={`relative p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"
        } ${hoverBg} ${!notification.isRead ? unreadBg : ""
        } cursor-pointer transition-colors`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => {
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
        // TODO: Navigate to notification link
      }}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? "bg-blue-900/50" : "bg-blue-100"
              }`}
          >
            <Bell
              className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}
            />
          </div>
          {/* Unread indicator dot */}
          {!notification.isRead && (
            <div
              className={`w-3 h-3 bg-blue-500 rounded-full absolute top-4 left-14 border-2 ${isDarkMode ? "border-gray-800" : "border-white"
                }`}
            ></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-semibold ${textColor} leading-snug mb-1`}
          >
            {notification.title}
          </h4>
          <p className={`text-sm ${mutedColor} leading-snug line-clamp-2`}>
            {notification.content}
          </p>
          <p className={`text-xs ${mutedColor} mt-1 flex items-center gap-1`}>
            {timeAgo}
            {!notification.isRead && (
              <>
                <span>•</span>
                <span
                  className={isDarkMode ? "text-blue-400" : "text-blue-600"}
                >
                  Mới
                </span>
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-start gap-1">
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className={`p-1.5 rounded-lg ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                  } transition-colors`}
                title="Đánh dấu đã đọc"
              >
                <Check
                  className={`w-4 h-4 ${isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className={`p-1.5 rounded-lg ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                } transition-colors`}
              title="Xóa thông báo"
            >
              <Trash2
                className={`w-4 h-4 ${isDarkMode ? "text-red-400" : "text-red-600"
                  }`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Component cho lời mời kết bạn
function FriendRequestItem({
  request,
  isDarkMode,
  onDismiss,
}: {
  request: FriendRequestResponse;
  isDarkMode: boolean;
  onDismiss: () => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "accepted" | "rejected">(
    "idle"
  );

  const hoverBg = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const textColor = isDarkMode ? "text-gray-100" : "text-gray-900";
  const mutedColor = isDarkMode ? "text-gray-400" : "text-gray-500";

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setState("loading");
    try {
      await friendService.acceptRequest(request.requestId);
      await roomService.createPrivateRoom({ targetUserId: request.senderId });

      // Trigger inbox refresh in FloatingChatButton
      window.dispatchEvent(new CustomEvent("refresh-inbox"));

      setState("accepted");
      setTimeout(onDismiss, 2000);
    } catch {
      setState("accepted");
      setTimeout(onDismiss, 2000);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setState("loading");
    try {
      await friendService.rejectRequest(request.requestId);
    } catch {
      // ignore
    } finally {
      setState("rejected");
      setTimeout(onDismiss, 1200);
    }
  };

  return (
    <div
      className={`relative p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"
        } ${hoverBg} bg-cyan-500/5 cursor-pointer transition-colors`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative">
            <SenderAvatar
              avatar={request.senderAvatar || ""}
              name={request.senderName || "?"}
              size="lg"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
              <UserPlus size={10} className="text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {state === "accepted" ? (
            <p className="text-sm font-semibold text-green-500">
              ✓ Đã kết bạn! Phòng chat đã được tạo.
            </p>
          ) : state === "rejected" ? (
            <p className="text-sm font-semibold text-gray-400">Đã từ chối</p>
          ) : (
            <>
              <h4 className={`text-sm font-bold ${textColor} leading-snug mb-1`}>
                Lời mời kết bạn
              </h4>
              <p className={`text-sm ${mutedColor} leading-snug mb-2`}>
                <span className="font-semibold text-cyan-500">
                  {request.senderName || "?"}
                </span>{" "}
                muốn kết bạn với bạn
              </p>

              <div className="flex items-center gap-2">
                {state === "idle" ? (
                  <>
                    <button
                      onClick={handleAccept}
                      className="px-4 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-cyan-500/30"
                    >
                      Chấp nhận
                    </button>
                    <button
                      onClick={handleReject}
                      className={`px-4 py-1.5 rounded-full ${isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-100 hover:bg-gray-200"
                        } ${mutedColor} text-xs font-bold transition-all active:scale-95`}
                    >
                      Từ chối
                    </button>
                  </>
                ) : (
                  <Loader2 size={16} className="animate-spin text-cyan-500" />
                )}
              </div>
            </>
          )}
        </div>

        {/* Unread indicator dot */}
        {state === "idle" && (
          <div
            className={`w-3 h-3 bg-cyan-500 rounded-full absolute top-4 right-4 animate-pulse`}
          ></div>
        )}
      </div>
    </div>
  );
}
