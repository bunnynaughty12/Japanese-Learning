// API Configuration
export const API_CONFIG = {
  BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  TIMEOUT: 10000, // 10 giây
} as const;

// API Endpoints (flat)
export const API_ENDPOINTS = {
  ASSESSMENT_ITEM: {
    BY_SECTION: (sectionId: string) =>
      `/assessment-items/section/${sectionId}`,
    GET_ALL: "/assessment-items",
    DETAIL: (id: string) =>
      `/assessment-items/${id}`,

    UPDATE: (id: string) =>
      `/assessment-items/${id}`,
  },
  PASSAGE: {
    GET_BY_ID: (id: string) => `/passages/${id}`,
    UPDATE: (id: string) => `/passages/${id}`,
    DELETE: (id: string) => `/passages/${id}`,
  },
  S3: {
    UPLOAD: "/s3/upload",
    GET_IMAGES_FILES: "/s3/images/urls",
    GET_AUDIOS_FILES: "/s3/audios/urls",
    GET_ASSESSEMENT_FILES: "/s3/assessment/urls",
    DELETE_AUDIO: "/s3/audio",
    DELETE_ASSESSEMENT: "/s3/assessment",
    DELETE_IMAGE: "/s3/image",
  },
  USER: {
    GET_USER_BY_ID: (id: string) => `/users/chat/${id}`,
    PROFILE: "/users/me",
    UPDATE_PROFILE: "/users/me",
    UPLOAD_AVATAR: "/users/upload-avatar",
    CHANGE_PASSWORD: "/users/change-password",
    ALL_USERS: "/admin/users",
    SEARCH: "/users/search", // ✅ thêm dòng này
  },
  ORDER: {
    MY_ORDERS: "/orders/me",
    MY_ORDER_DETAIL: (orderCode: string) =>
      `/orders/me/${orderCode}`,
  },
  VIDEO_EXERCISE: {
    GET_BY_VIDEO: (videoId: string) => `/video-exercises/video/${videoId}`,
  },
  PAYMENT: {
    VNPAY_CREATE: `/payments/vnpay/create`,

    VNPAY_RETURN: (responseCode: string, txnRef: string) =>
      `/payments/vnpay/return?vnp_ResponseCode=${responseCode}&vnp_TxnRef=${txnRef}`,
  },

  LESSON_PART_PROGRESS: {
    UPDATE: "/lesson-part-progress",
    GET: (lessonPartId: string) => `/lesson-part-progress/${lessonPartId}`,
  },

  CHAT_ROOM: {
    MY_GROUP_ROOMS: "/chat-room/my-group-rooms", // 👈 thêm dòng này
    MY_ROOMS: "/chat-room/my-rooms",
    CREATE_GROUP: "/chat-room/group", // 👈 thêm dòng này
    CREATE_PRIVATE: "/chat-room/private",
    GET_BY_ID: (roomId: string) => `/chat-room/${roomId}`,
    MESSAGES: (roomId: string, page: number, size: number) =>
      `/chat-room/${roomId}/messages?page=${page}&size=${size}`,
    SEARCH: (keyword: string) =>
      `/chat-room/search?keyword=${encodeURIComponent(keyword)}`,
    MY_USERS: "/chat-room/my-users",
    GROUP_DETAIL: (roomId: string) => `/chat-room/group/${roomId}`,
  },
  /* ===================== COURSE ===================== */
  COURSE: {
    CREATE: "/course",
    GET_MY_PROGRESS: "/courses/my-progress",
    GET_ALL: "/course",
    UPDATE: (id: string) => `/course/${id}`,   // 👈 thêm dòng này

    GET_DETAIL: (courseId: string) => `/course/${courseId}`,
    TOGGLE_ACTIVE: (courseId: string) => `/course/${courseId}/toggle`,
    GET_PROGRESS: (courseId: string) => `/courses/${courseId}/progress`,
  },
  KANJI: {
    GET_ALL: "/kanji",
    GET_BY_ID: (id: string) => `/kanji/${id}`,
    CREATE: "/kanji",
    CHECK: "/kanji/check",
  },

  /* ===================== SECTION ===================== */
  SECTION: {
    CREATE: "/section",
    GET_BY_COURSE: (courseId: string) => `/section/course/${courseId}`,
    GET_DETAIL: (sectionId: string) => `/section/${sectionId}`,
    DELETE: (sectionId: string) => `/section/${sectionId}`,
    UPDATE: (sectionId: string) =>
      `/section/${sectionId}`,
  },
  // config/api.ts

  LESSON_DOCUMENT: {
    CREATE: "/lesson-document",
    GET_BY_LESSON: (lessonId: string) => `/lesson-document/lesson/${lessonId}`,
    GET_DETAIL: (id: string) => `/lesson-document/${id}`,
    DELETE: (id: string) => `/lesson-document/${id}`,
  },

  /* ===================== LESSON ===================== */
  LESSON: {
    CREATE: "/lesson",
    GET_BY_SECTION: (sectionId: string) => `/lesson/section/${sectionId}`,
    GET_DETAIL: (lessonId: string) => `/lesson/${lessonId}`,
    DELETE: (lessonId: string) => `/lesson/${lessonId}`,
    UPDATE: (id: string) => `/lesson/${id}`,

  },

  /* ===================== SECTION DOCUMENT ===================== */
  SECTION_DOCUMENT: {
    CREATE: "/section-document",
    GET_BY_SECTION: (sectionId: string) =>
      `/section-document/section/${sectionId}`,
  },
  LESSON_PART: {
    CREATE: "/lesson-part",
    GET_BY_LESSON: (lessonId: string) => `/lesson-part/lesson/${lessonId}`,
    GET_DETAIL: (id: string) => `/lesson-part/${id}`,
    DELETE: (id: string) => `/lesson-part/${id}`,
    UPDATE: (id: string) =>
      `/lesson-part/${id}`,
  },

  /* ===================== ADMIN ===================== */
  ADMIN: {
    PROGRESS_VIEW: "/admin/learning-progress/:userId",
    PROGRESS_RESULT_DAILY: "/admin/learning-progress/:userId/daily",
    ALL_USERS_MANAGER: "/admin/users/manager",
    BAN_USER: (email: string) => `/admin/users/ban/${email}`,
    UNBAN_USER: (email: string) => `/admin/users/unban/${email}`,
    DELETE_USER: `/admin/users/delete-account`,
    DELETE_USERS: `/admin/users/delete-accounts`,
    USER_STATISTICS: "/admin/users/stats",
  },

  NOTIFICATION: {
    GET_MY: "/notifications",
    MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_AS_READ: "/notifications/read-all",
    DELETE: (id: string) => `/notifications/${id}`,
  },

  FORGOT_PASSWORD: "/users/forgot-password",
  CONFIRM_FORGOT_PASSWORD: "/users/confirm-forgot-password",
  REGISTER: "/users/register",
  LOGIN: "/auth/login",
  REFRESH_TOKEN: "/auth/refresh-token",
  LOG_OUT: "/auth/logout",

  /* ===================== VIDEO ===================== */
  VIDEO: {
    GET_ALL_PROGRESS: "/video-tracking",
    UPLOAD: "/youtube/upload",
    TRACK_PROGRESS: "/video-tracking",
    SAVE: (videoId: string) => `/youtube/${videoId}`,
    VIEW: "/youtube",
    VIEW_BY_ID: "/transcripts",
    MY_SAVED: "/youtube/me",
    SEARCH: "/videos/search",
    VIEW_BY_VOCAB: "/youtube/vocab",
    COMMENTS: "/youtube/comments",
    GET_COMMENTS: (videoId: string) =>
      `/youtube/comments/${videoId}`,
    DELETE_COMMENT: (commentId: string) =>
      `/youtube/comments/${commentId}`,
    UPDATE: (videoId: string) => `/youtube/${videoId}`,

    RATINGS: "/youtube/ratings",
    GET_RATING: (videoId: string) =>
      `/youtube/ratings/${videoId}`,
    DELETE_RATING: (videoId: string) =>
      `/youtube/ratings/${videoId}`,
  },

  LEARNING_PROGRESS: {
    PROGRESS_VIEW: "/learning-progress",
    PROGRESS_RESULT_DAILY: "/learning-progress",
  },

  EXAM: {
    EXAM_VIEW_ALL: "/exams",
    QUESTION_LISTEN: "/questions/listen",
    EXAM_SUBMIT: "exams/submit",
    EXAM_START: "/exams/start",
    IMPORT: "/exams/import",
    GET_SECTIONS: (examId: string) => `/exams/sections/${examId}`,
    DELETE: (id: string) => `/exams/${id}`,
  },

  QUESTION: {
    GET_ALL: "/questions",
    GET_BY_EXAM_ID: (examId: string) => `/questions/exam/${examId}`,
    CREATE: "/questions",
    UPDATE: (id: string) => `/questions/${id}`,
    DELETE: (id: string) => `/questions/${id}`,
  },

  TRANSLATE: {
    CREATE: "/translates",
  },

  PRONUNCIATION: {
    SUBMIT: "/pronunciation/submit",
    RESULT: "/pronunciation/result",
  },

  AI: {
    CHAT: "/ai/chat",
    REALTIME_TOKEN: "/ai/realtime-token",
  },
  BATCH: {
    RUN: "/batch/run",
  },
  REVENUE: {
    SUMMARY: "/admin/revenue/summary",
    BY_DAY: (date: string) =>
      `/admin/revenue/day?date=${date}`,
    BY_MONTH: (year: number, month: number) =>
      `/admin/revenue/month?year=${year}&month=${month}`,
    SUCCESS_COUNT: "/admin/revenue/success-count",
  },
  ENROLLMENT: {
    CHECK: (courseId: string) =>
      `/enrollments/check/${courseId}`,
    MY_COURSES: "/enrollments/my-courses",

  },
  FEEDBACK: {
    CREATE: "/feedbacks",
    GET_MY: "/feedbacks/my-feedbacks",
  },
  ADMIN_FEEDBACK: {
    GET_ALL: "/admin/feedbacks",
    UPDATE: (id: string) => `/admin/feedbacks/${id}`,
  },
  VOCAB: {
    MARK_VOCAB: "/learning/vocab/mark",
    CREATE: "/vocab",
    GET_MY: "/vocab",
    GET_MY_VIDEO: (videoId: string) => `/vocab/my/video/${videoId}`,
    UPDATE_MEANING: "/vocab",
    DELETE: (surface: string) => `/vocab/${encodeURIComponent(surface)}`,
    GET_STATUS: (vocabId: string) => `/vocab/${vocabId}/status`,
    GET_PROGRESS: "/learning/vocab/progress",
  },
  // src/config/api.ts
  SKILL_PROGRESS: {
    GET_MY: "/skill-progress",
  },
  VIP: {
    GET_ALL: "/vip-packages",
    CREATE: "/vip-packages",
    PURCHASE: "/vip-purchases",
    GET_MY_VIP: "/vip/me",
    UPDATE: (id: string) => `/vip-packages/${id}`,
    DELETE: (id: string) => `/vip-packages/${id}`,
  },

  FRIEND: {
    SEND_REQUEST: (receiverId: string) => `/friends/request/${receiverId}`,
    GET_STATUS: (userId: string) => `/friends/status/${userId}`,
    ACCEPT: (requestId: string) => `/friends/accept/${requestId}`,
    REJECT: (requestId: string) => `/friends/reject/${requestId}`,
    UNFRIEND: (userId: string) => `/friends/${userId}`,
    GET_PENDING: "/friends/pending", // ✅ thêm dòng này
  },
} as const;

// Helper function để lấy full endpoint URL
export const getEndpoint = (endpointKey: keyof typeof API_ENDPOINTS) => {
  return `${API_CONFIG.BASE_URL}${API_ENDPOINTS[endpointKey]}`;
};
