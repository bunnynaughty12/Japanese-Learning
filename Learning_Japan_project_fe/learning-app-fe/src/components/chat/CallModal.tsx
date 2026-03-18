"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  sendIncomingNotification,
} from "@/services/callService";

interface Props {
  roomId: string;
  isCaller: boolean;
  currentUserId: string;
  receiverId?: string;
  contactName: string;
  contactAvatar: string;
  callerName?: string; // ✅ tên của caller (người gọi)
  callerAvatar?: string; // ✅ avatar của caller (người gọi)
  isDarkMode?: boolean;
  onClose: () => void;
}

type CallState = "connecting" | "ringing" | "in-call" | "ended";

export const CallModal = ({
  roomId,
  isCaller,
  currentUserId,
  receiverId,
  contactName,
  contactAvatar,
  callerName, // ✅
  callerAvatar, // ✅
  isDarkMode = false,
  onClose,
}: Props) => {
  const { createPeerConnection, getLocalStream, addTracksToPeer } = useWebRTC();
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);
  const stompRef = useRef<Client | null>(null);
  const peerLocalRef = useRef<RTCPeerConnection | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [callState, setCallState] = useState<CallState>(
    isCaller ? "connecting" : "ringing"
  );
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // ✅ Phát chuông khi receiver nhận cuộc gọi
  useEffect(() => {
    if (callState === "ringing" && !isCaller) {
      const audio = new Audio(
        "https://www.soundjay.com/phone/sounds/telephone-ring-01a.mp3"
      );
      audio.loop = true;
      audio.play().catch(console.error);
      ringAudioRef.current = audio;
    } else {
      if (ringAudioRef.current) {
        ringAudioRef.current.pause();
        ringAudioRef.current.currentTime = 0;
        ringAudioRef.current = null;
      }
    }
    return () => {
      if (ringAudioRef.current) {
        ringAudioRef.current.pause();
        ringAudioRef.current = null;
      }
    };
  }, [callState, isCaller]);

  useEffect(() => {
    if (callState !== "in-call") return;
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [callState]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleEndCall = useCallback(() => {
    if (stompRef.current?.connected) {
      stompRef.current.publish({
        destination: "/app/call.end",
        body: JSON.stringify({ type: "end", roomId, senderId: currentUserId }),
      });
    }
    peerLocalRef.current?.close();
    setCallState("ended");
    setTimeout(onClose, 800);
  }, [roomId, currentUserId, onClose]);

  const handleAccept = useCallback(async () => {
    const peer = peerLocalRef.current;
    const stomp = stompRef.current;
    if (!peer || !stomp?.connected) return;

    const stream = await getLocalStream();
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    addTracksToPeer();

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    sendAnswer(stomp, roomId, answer, currentUserId);
    setCallState("in-call");
  }, [roomId, currentUserId, getLocalStream, addTracksToPeer]);

  const toggleMute = () => {
    const sender = peerLocalRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "audio");
    if (sender?.track) {
      sender.track.enabled = isMuted;
      setIsMuted((v) => !v);
    }
  };

  useEffect(() => {
    let subscription: StompSubscription | undefined;
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
      reconnectDelay: 0,

      onConnect: async () => {
        const peer = createPeerConnection();
        peerLocalRef.current = peer;

        peer.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
          if (event.candidate) {
            sendIceCandidate(client, roomId, event.candidate, currentUserId);
          }
        };

        peer.ontrack = (event: RTCTrackEvent) => {
          if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setCallState("in-call");
        };

        subscription = client.subscribe(
          `/topic/call/${roomId}`,
          async (message) => {
            const signal = JSON.parse(message.body) as {
              roomId: string;
              senderId: string;
              type: "offer" | "answer" | "ice" | "end";
              data?: RTCSessionDescriptionInit | RTCIceCandidateInit;
            };

            if (signal.senderId === currentUserId) return;

            switch (signal.type) {
              case "offer":
                if (signal.data) {
                  await peer.setRemoteDescription(
                    signal.data as RTCSessionDescriptionInit
                  );
                  setCallState("ringing");
                }
                break;
              case "answer":
                if (signal.data) {
                  await peer.setRemoteDescription(
                    signal.data as RTCSessionDescriptionInit
                  );
                  setCallState("in-call");
                }
                break;
              case "ice":
                if (signal.data) {
                  try {
                    await peer.addIceCandidate(
                      new RTCIceCandidate(signal.data as RTCIceCandidateInit)
                    );
                  } catch (e) {
                    console.error("addIceCandidate:", e);
                  }
                }
                break;
              case "end":
                peer.close();
                setCallState("ended");
                setTimeout(onClose, 800);
                break;
            }
          }
        );

        if (isCaller) {
          if (receiverId) {
            sendIncomingNotification(client, {
              roomId,
              callerId: currentUserId,
              callerName: callerName ?? contactName, // ✅ dùng callerName
              callerAvatar: callerAvatar ?? contactAvatar, // ✅ dùng callerAvatar
              receiverId,
            });
          } else {
            console.warn("[CallModal] isCaller=true nhưng thiếu receiverId!");
          }

          await new Promise((resolve) => setTimeout(resolve, 800));
          const stream = await getLocalStream();
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          addTracksToPeer();

          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          sendOffer(client, roomId, offer, currentUserId);
          setCallState("ringing");
        }
      },

      onStompError: (frame) => console.error("STOMP error:", frame),
    });

    stompRef.current = client;
    client.activate();

    return () => {
      subscription?.unsubscribe();
      peerLocalRef.current?.close();
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Hiển thị đúng avatar và tên theo từng phía
  const displayName = isCaller ? contactName : callerName ?? contactName;
  const displayAvatar = isCaller
    ? contactAvatar
    : callerAvatar ?? contactAvatar;

  const stateLabel: Record<CallState, string> = {
    connecting: "Đang kết nối...",
    ringing: isCaller ? "Đang đổ chuông..." : "Cuộc gọi đến",
    "in-call": formatDuration(callDuration),
    ended: "Cuộc gọi kết thúc",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`relative w-80 md:w-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center py-10 px-8 gap-6 transition-colors ${isDarkMode
            ? "bg-gray-900 border border-gray-700"
            : "bg-white border border-cyan-100"
          }`}
      >
        {(callState === "ringing" || callState === "connecting") && (
          <span className="absolute inset-0 rounded-3xl animate-ping opacity-10 bg-cyan-400 pointer-events-none" />
        )}

        <div className="relative">
          {callState !== "in-call" ? (
            <img
              src={displayAvatar || "/default-avatar.png"} // ✅ dùng displayAvatar
              alt={displayName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-cyan-400 shadow-xl"
            />
          ) : (
            <div className="relative w-full max-w-sm aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video - Picture in Picture */}
              <div className="absolute bottom-4 right-4 w-1/4 min-w-[80px] aspect-video bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-xl z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          {callState === "in-call" && (
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="text-center">
          <h2
            className={`text-xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-800"
              }`}
          >
            {displayName} {/* ✅ dùng displayName */}
          </h2>
          <p
            className={`text-sm mt-1 ${callState === "in-call"
                ? "text-emerald-500 font-mono font-semibold"
                : isDarkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
          >
            {stateLabel[callState]}
          </p>
        </div>

        {callState === "in-call" && (
          <div className="flex items-end gap-1 h-6">
            {[3, 6, 9, 6, 3, 8, 4].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-cyan-400 rounded-full animate-pulse"
                style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}

        {callState !== "ended" && (
          <div className="flex items-center gap-5 mt-2">
            {callState === "in-call" && (
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow ${isMuted
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic
                    className={`w-5 h-5 ${isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                  />
                )}
              </button>
            )}

            {callState === "ringing" && !isCaller && (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
              >
                <Volume2
                  className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                />
              </div>
            )}

            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>

            {callState === "ringing" && !isCaller && (
              <button
                onClick={handleAccept}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        )}

        {callState === "ended" && (
          <p
            className={`text-sm animate-pulse ${isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
          >
            Đang đóng...
          </p>
        )}
      </div>
    </div>
  );
};
