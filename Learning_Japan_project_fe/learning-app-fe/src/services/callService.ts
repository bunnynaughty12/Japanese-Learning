import { Client } from "@stomp/stompjs";

export const sendOffer = (
  stomp: Client,
  roomId: string,
  offer: RTCSessionDescriptionInit,
  senderId: string
) => {
  stomp.publish({
    destination: "/app/call.offer",
    body: JSON.stringify({ type: "offer", roomId, senderId, data: offer }),
  });
};

export const sendAnswer = (
  stomp: Client,
  roomId: string,
  answer: RTCSessionDescriptionInit,
  senderId: string
) => {
  stomp.publish({
    destination: "/app/call.answer",
    body: JSON.stringify({ type: "answer", roomId, senderId, data: answer }),
  });
};

export const sendIceCandidate = (
  stomp: Client,
  roomId: string,
  candidate: RTCIceCandidate,
  senderId: string
) => {
  stomp.publish({
    destination: "/app/call.ice",
    body: JSON.stringify({ type: "ice", roomId, senderId, data: candidate }),
  });
};

/**
 * ✅ Gọi hàm này ngay khi user A bấm nút gọi
 * để backend notify cho user B biết có cuộc gọi đến
 */
export const sendIncomingNotification = (
  stomp: Client,
  params: {
    roomId: string;
    callerId: string;
    callerName: string;
    callerAvatar: string;
    receiverId: string; // userId của người được gọi
  }
) => {
  stomp.publish({
    destination: "/app/call.incoming",
    body: JSON.stringify({
      type: "incoming",
      ...params,
    }),
  });
};
