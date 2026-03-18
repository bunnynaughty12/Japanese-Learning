"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * useShareMessage
 *
 * Đọc query param `shareMsg` từ URL sau khi share video redirect về chat.
 * Tự động điền nội dung vào message input và xóa param khỏi URL.
 *
 * Dùng ở chat page (nơi quản lý state `message`):
 *
 *   useShareMessage((msg) => setMessage(msg));
 */
export function useShareMessage(onMessage: (msg: string) => void) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const shareMsg = searchParams.get("shareMsg");
    if (!shareMsg) return;

    // Điền vào input
    onMessage(decodeURIComponent(shareMsg));

    // Xóa shareMsg khỏi URL để không bị re-trigger khi re-render
    const params = new URLSearchParams(searchParams.toString());
    params.delete("shareMsg");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(newUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy 1 lần khi mount
}
