"use client";
import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Radio,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

// Types
interface SignalMessage {
  type: "join" | "offer" | "answer" | "candidate";
  room: string;
  senderId?: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit | Record<string, never>;
}

interface StompMessage {
  body: string;
}

interface MediaError extends Error {
  name: string;
  message: string;
}

export default function WebRTCPage() {
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const sessionIdRef = useRef<string>(sessionId);
  const isInitiatorRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);
  const localVideoAttachedRef = useRef<boolean>(false); // 🔥 FIX: Flag chặn duplicate attachment

  // State
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [error, setError] = useState<string>("");
  const [cameraLoading, setCameraLoading] = useState(false);

  // WebRTC configuration
  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Initialize STOMP client and connect to WebSocket
  const connectWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log("STOMP Debug:", str);
      },
      onConnect: () => {
        console.log("✅ Connected to WebSocket");
        setConnected(true);

        // Subscribe to signaling messages
        client.subscribe("/topic/signal", (message: StompMessage) => {
          const signal: SignalMessage = JSON.parse(message.body);
          console.log("📨 Received signal:", signal);

          // Ignore messages from self
          if (signal.senderId === sessionIdRef.current) {
            console.log("Ignoring own message");
            return;
          }

          // Filter by room
          if (signal.room === room) {
            handleSignal(signal);
          }
        });

        // 🔥 FIX: Send join signal ONLY after WebSocket is fully connected
        console.log(
          "📢 Sending join signal for room:",
          room,
          "session:",
          sessionIdRef.current
        );
        sendSignal("join");
      },
      onStompError: (frame: {
        headers: Record<string, string>;
        body: string;
      }) => {
        console.error("❌ STOMP error:", frame);
        setConnected(false);
        setError("WebSocket connection failed");
      },
    });

    client.activate();
    stompClientRef.current = client;
  };

  // Handle incoming signaling messages
  const handleSignal = async (signal: SignalMessage) => {
    const { type, data } = signal;

    switch (type) {
      case "join":
        console.log("👤 New user joined, session:", signal.senderId);
        // Only the first user creates an offer
        if (!isInitiatorRef.current) {
          console.log("I will be the initiator");
          isInitiatorRef.current = true;
          // Wait a bit to ensure local stream is ready
          setTimeout(() => {
            if (localStreamRef.current) {
              createOffer();
            } else {
              console.warn("⚠️ Local stream not ready yet, waiting...");
              // Retry after another delay
              setTimeout(() => createOffer(), 500);
            }
          }, 500);
        }
        break;

      case "offer":
        console.log("📩 Received offer, creating answer...");
        await handleOffer(data as RTCSessionDescriptionInit);
        break;

      case "answer":
        console.log("✅ Received answer");
        await handleAnswer(data as RTCSessionDescriptionInit);
        break;

      case "candidate":
        console.log("🔄 Received ICE candidate");
        await handleCandidate(data as RTCIceCandidateInit);
        break;

      default:
        console.warn("⚠️ Unknown signal type:", type);
    }
  };

  // Send signaling message via STOMP
  const sendSignal = (
    type: string,
    data:
      | RTCSessionDescriptionInit
      | RTCIceCandidateInit
      | Record<string, never> = {}
  ) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      const message: SignalMessage = {
        type: type as "join" | "offer" | "answer" | "candidate",
        room,
        senderId: sessionIdRef.current,
        data,
      };
      console.log("📤 Sending signal:", type, "to room:", room);
      stompClientRef.current.publish({
        destination: "/app/signal",
        body: JSON.stringify(message),
      });
    } else {
      console.error("❌ STOMP client not connected");
    }
  };

  // Initialize peer connection
  const initPeerConnection = (): RTCPeerConnection | null => {
    console.log("🔧 Initializing peer connection");

    // Safety check - ensure we have local stream
    if (!localStreamRef.current) {
      console.error(
        "❌ Cannot init peer connection: No local stream available"
      );
      setError("Lỗi: Không thể khởi tạo kết nối. Vui lòng thử lại.");
      return null;
    }

    // Close existing connection if any
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    localStreamRef.current.getTracks().forEach((track) => {
      if (localStreamRef.current) {
        pc.addTrack(track, localStreamRef.current);
        console.log("➕ Added local track:", track.kind, track.label);
      }
    });

    // Handle ICE candidates
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log("🧊 New ICE candidate");
        sendSignal("candidate", event.candidate.toJSON());
      }
    };

    // Handle remote stream
    pc.ontrack = (event: RTCTrackEvent) => {
      console.log("📺 Received remote track:", event.track.kind);

      if (!remoteVideoRef.current) return;

      let remoteStream = remoteVideoRef.current.srcObject as MediaStream;

      if (!remoteStream) {
        remoteStream = new MediaStream();
        remoteVideoRef.current.srcObject = remoteStream;
      }

      // ⚠️ Tránh add trùng track
      const exists = remoteStream
        .getTracks()
        .some((t) => t.id === event.track.id);

      if (!exists) {
        remoteStream.addTrack(event.track);
        console.log("➕ Remote track added:", event.track.kind);
      }

      setRemoteConnected(true);
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log("🔌 Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setRemoteConnected(true);
        processIceCandidatesQueue();
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed"
      ) {
        setRemoteConnected(false);
      }
    };

    // ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE connection state:", pc.iceConnectionState);
    };

    // Signaling state
    pc.onsignalingstatechange = () => {
      console.log("📡 Signaling state:", pc.signalingState);
    };

    return pc;
  };

  // Process queued ICE candidates
  const processIceCandidatesQueue = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    console.log(
      "Processing",
      iceCandidatesQueue.current.length,
      "queued candidates"
    );

    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("✅ Added queued ICE candidate");
        } catch (error) {
          console.error("❌ Error adding queued ICE candidate:", error);
        }
      }
    }
  };

  // Create and send offer
  const createOffer = async () => {
    try {
      console.log("Creating offer...");

      // Ensure local stream exists before creating offer
      if (!localStreamRef.current) {
        console.error("❌ Cannot create offer: No local stream");
        setError("Lỗi: Không có stream. Vui lòng tải lại trang.");
        return;
      }

      const pc = initPeerConnection();

      // Check if peer connection was successfully created
      if (!pc) {
        console.error("❌ Failed to initialize peer connection");
        return;
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      console.log("📝 Created and set local offer");
      sendSignal("offer", offer);
    } catch (error) {
      console.error("❌ Error creating offer:", error);
      setError("Failed to create offer");
    }
  };

  // Handle received offer and create answer
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      console.log("Handling offer...");
      let pc = peerConnectionRef.current;

      if (!pc) {
        pc = initPeerConnection();
        // Check if initialization was successful
        if (!pc) {
          console.error("❌ Failed to initialize peer connection");
          setError("Lỗi: Không thể tạo kết nối");
          return;
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("✅ Set remote description with offer");

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("📝 Created and set local answer");
      sendSignal("answer", answer);

      processIceCandidatesQueue();
    } catch (error) {
      console.error("❌ Error handling offer:", error);
      setError("Failed to handle offer");
    }
  };

  // Handle received answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.error("❌ No peer connection found");
        return;
      }

      console.log("Current signaling state:", pc.signalingState);

      if (pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("✅ Set remote description with answer");
        processIceCandidatesQueue();
      } else {
        console.warn("⚠️ Ignoring answer, current state:", pc.signalingState);
      }
    } catch (error) {
      console.error("❌ Error handling answer:", error);
      setError("Failed to handle answer");
    }
  };

  // Handle received ICE candidate
  const handleCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.warn("⚠️ No peer connection, queueing ICE candidate");
        iceCandidatesQueue.current.push(candidate);
        return;
      }

      if (!pc.remoteDescription) {
        console.warn("⚠️ No remote description yet, queueing ICE candidate");
        iceCandidatesQueue.current.push(candidate);
        return;
      }

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("✅ Added ICE candidate");
    } catch (error) {
      console.error("❌ Error adding candidate:", error);
    }
  };

  // 🔥 FIX: Get user media - CHỈ lưu stream, KHÔNG attach video
  const getUserMedia = async () => {
    try {
      setCameraLoading(true);
      setError("");

      console.log("📹 Requesting user media...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log(
        "✅ Got user media, tracks:",
        stream.getTracks().map((t) => `${t.kind}: ${t.label}`)
      );

      // 🔥 CHỈ LƯU STREAM, KHÔNG PLAY Ở ĐÂY
      localStreamRef.current = stream;

      setCameraLoading(false);
      return stream;
    } catch (err) {
      const error = err as MediaError;
      console.error("❌ Error getting user media:", error);
      setCameraLoading(false);

      let errorMessage = "Cannot access camera/microphone. ";
      if (error.name === "NotAllowedError") {
        errorMessage += "Please allow camera and microphone permissions.";
      } else if (error.name === "NotFoundError") {
        errorMessage += "No camera or microphone found.";
      } else {
        errorMessage += error.message;
      }

      setError(errorMessage);
      alert(errorMessage);
      throw error;
    }
  };

  // Join room
  const handleJoinRoom = async () => {
    if (!room.trim()) {
      alert("Vui lòng nhập tên phòng");
      return;
    }

    try {
      console.log("🚀 Joining room:", room);

      // Get user media first
      await getUserMedia();

      // Mark as joined (trigger useEffect attach video)
      setJoined(true);

      // Connect to WebSocket (will auto-send join signal when connected)
      connectWebSocket();
    } catch (error) {
      console.error("❌ Error joining room:", error);
      setJoined(false);
    }
  };

  // Leave room
  const handleLeaveRoom = () => {
    console.log("👋 Leaving room...");

    // Pause and clear video elements FIRST
    if (localVideoRef.current) {
      localVideoRef.current.pause();
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.pause();
      remoteVideoRef.current.srcObject = null;
    }

    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind);
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Disconnect STOMP
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }

    // Clear ICE candidates queue
    iceCandidatesQueue.current = [];
    isInitiatorRef.current = false;
    localVideoAttachedRef.current = false; // 🔥 FIX: Reset flag

    // Reset state
    setJoined(false);
    setConnected(false);
    setRemoteConnected(false);
    setError("");
    console.log("✅ Left room successfully");
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        console.log("📹 Video", videoTrack.enabled ? "enabled" : "disabled");
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        console.log("🎤 Audio", audioTrack.enabled ? "enabled" : "disabled");
      }
    }
  };

  // 🔥 FIX: useEffect riêng để attach local video (an toàn với re-render)
  useEffect(() => {
    const video = localVideoRef.current;
    const stream = localStreamRef.current;

    // Chỉ attach khi: có video element + có stream + chưa attach + đã join
    if (!video || !stream || localVideoAttachedRef.current || !joined) {
      return;
    }

    console.log("🔗 Attaching local video...");

    video.srcObject = stream;
    video.muted = true;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("▶️ Local video playing");
          localVideoAttachedRef.current = true;
        })
        .catch((e) => {
          // Ignore AbortError (harmless trong StrictMode)
          if (e.name !== "AbortError") {
            console.error("❌ Local video play failed:", e);
          }
        });
    }
  }, [joined]); // Chỉ chạy khi joined thay đổi

  // 🔥 FIX: Play remote video only once when stream is ready
  useEffect(() => {
    const video = remoteVideoRef.current;

    if (!video || !remoteConnected) return;

    const stream = video.srcObject as MediaStream;

    // Chỉ play khi có stream và có tracks
    if (stream && stream.getTracks().length > 0) {
      console.log("🔗 Remote stream ready, playing...");

      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("▶️ Remote video playing");
          })
          .catch((e) => {
            // Ignore AbortError
            if (e.name !== "AbortError") {
              console.error("❌ Remote video play failed:", e);
            }
          });
      }
    }
  }, [remoteConnected]); // Chỉ chạy khi remoteConnected thay đổi

  // 🔥 FIX: Cleanup ĐÚNG - chỉ chạy khi thực sự unmount, không bị StrictMode
  useEffect(() => {
    // Skip lần mount đầu tiên của StrictMode
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    // Cleanup chỉ chạy khi component THẬT SỰ unmount (user đóng tab/navigate)
    return () => {
      console.log("🧹 Component unmounting - cleaning up resources");
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log("🛑 Cleanup: Stopped track:", track.kind);
        });
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {/* Back Button */}
            <Link
              href="/video"
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md border border-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Quay lại</span>
            </Link>

            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-cyan-400 to-blue-500 p-3 rounded-2xl">
                  <Radio className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Video Call
                </h1>
                <p className="text-sm text-gray-600">
                  Kết nối trực tiếp với người khác
                </p>
              </div>
            </div>

            <div className="w-32"></div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-semibold">Lỗi</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Join Room Section */}
        {!joined ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl mb-4 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Tham gia phòng
                </h2>
                <p className="text-gray-600 text-sm">
                  Nhập tên phòng để bắt đầu cuộc gọi video
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên phòng
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Nhập tên phòng..."
                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                    onKeyPress={(e) =>
                      e.key === "Enter" && !cameraLoading && handleJoinRoom()
                    }
                    disabled={cameraLoading}
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={cameraLoading}
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-4 rounded-xl font-semibold hover:from-cyan-500 hover:to-blue-600 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {cameraLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang mở camera...
                    </span>
                  ) : (
                    "Tham gia ngay"
                  )}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <AlertCircle className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <p>
                    Bạn cần cho phép truy cập camera và microphone để sử dụng
                    tính năng này
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Status Bar */}
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        connected
                          ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-gray-700 font-medium">
                      {connected ? "Đã kết nối" : "Mất kết nối"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <span className="text-gray-700">
                      Phòng:{" "}
                      <span className="font-bold text-cyan-600">{room}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span className="font-medium">Rời phòng</span>
                </button>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Local Video */}
              <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-[450px] object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div className="absolute top-4 left-4">
                  <div className="bg-gradient-to-r from-cyan-500/90 to-blue-600/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg">
                    <span className="text-white font-semibold">Bạn</span>
                  </div>
                </div>
                {!videoEnabled && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <VideoOff className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-400 font-medium">Camera đã tắt</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Remote Video */}
              <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-[450px] object-cover"
                />
                <div className="absolute top-4 left-4">
                  <div className="bg-gradient-to-r from-purple-500/90 to-pink-600/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg">
                    <span className="text-white font-semibold">
                      {remoteConnected ? "Người dùng khác" : "Đang chờ..."}
                    </span>
                  </div>
                </div>
                {!remoteConnected && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <Users className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <p className="text-gray-300 font-medium text-lg mb-2">
                        Đang chờ người khác tham gia...
                      </p>
                      <p className="text-gray-500 text-sm">
                        Chia sẻ tên phòng để mời người khác
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleVideo}
                className={`group relative p-5 rounded-2xl transition-all transform hover:scale-110 shadow-lg ${
                  videoEnabled
                    ? "bg-white hover:bg-gray-50 text-gray-700"
                    : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                }`}
                title={videoEnabled ? "Tắt camera" : "Bật camera"}
              >
                {videoEnabled ? (
                  <Video className="w-7 h-7" />
                ) : (
                  <VideoOff className="w-7 h-7" />
                )}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {videoEnabled ? "Tắt camera" : "Bật camera"}
                  </span>
                </div>
              </button>
              <button
                onClick={toggleAudio}
                className={`group relative p-5 rounded-2xl transition-all transform hover:scale-110 shadow-lg ${
                  audioEnabled
                    ? "bg-white hover:bg-gray-50 text-gray-700"
                    : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                }`}
                title={audioEnabled ? "Tắt micro" : "Bật micro"}
              >
                {audioEnabled ? (
                  <Mic className="w-7 h-7" />
                ) : (
                  <MicOff className="w-7 h-7" />
                )}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {audioEnabled ? "Tắt micro" : "Bật micro"}
                  </span>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
