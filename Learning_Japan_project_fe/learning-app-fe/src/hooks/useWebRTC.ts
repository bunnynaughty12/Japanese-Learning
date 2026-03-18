import { useRef } from "react";

export const useWebRTC = () => {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerRef.current = peer;
    return peer;
  };

  const getLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;
    return stream;
  };

  const addTracksToPeer = () => {
    if (!peerRef.current || !localStreamRef.current) return;
    if (peerRef.current.signalingState === "closed") return;

    localStreamRef.current.getTracks().forEach((track) => {
      const alreadyAdded = peerRef.current!.getSenders().find(s => s.track === track);
      if (!alreadyAdded) {
        peerRef.current!.addTrack(track, localStreamRef.current!);
      }
    });
  };

  return {
    peerRef,
    localStreamRef,
    createPeerConnection,
    getLocalStream,
    addTracksToPeer,
  };
};
