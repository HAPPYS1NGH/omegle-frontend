import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RoomHeader } from "./RoomHeader";
import { ConnectionStatusBar } from "./ConnectionStatusBar";
import { VideoDisplay } from "./VideoDisplay";
import { MediaControls } from "./MediaControls";
import { LoadingIndicator } from "./LoadingIndicator";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC, ConnectionStatus } from "../hooks/useWebRTC";

export const Room = ({
  name,
  localAudioTrack,
  localVideoTrack,
  videoEnabled,
  audioEnabled,
  onToggleVideo,
  onToggleAudio,
  videoDevices,
  audioDevices,
  selectedVideoDeviceId,
  selectedAudioDeviceId,
  onSelectVideoDevice,
  onSelectAudioDevice,
}: {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  videoDevices: { deviceId: string; label: string }[];
  audioDevices: { deviceId: string; label: string }[];
  selectedVideoDeviceId: string;
  selectedAudioDeviceId: string;
  onSelectVideoDevice: (deviceId: string) => void;
  onSelectAudioDevice: (deviceId: string) => void;
}) => {
  const [lobby, setLobby] = useState(true);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize WebRTC
  const webRTC = useWebRTC({
    localAudioTrack,
    localVideoTrack,
    remoteVideoRef,
    setConnectionStatus,
    setConnectionError,
  });

  // Handle reconnection attempts
  const handleReconnect = useCallback(() => {
    if (isReconnecting) return;

    setIsReconnecting(true);
    setConnectionStatus("connecting");
    setConnectionError(null);

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Set a timeout to prevent infinite reconnection attempts
    reconnectTimeoutRef.current = setTimeout(() => {
      if (connectionStatus !== "connected") {
        setConnectionStatus("failed");
        setConnectionError("Connection timed out. Please try again.");
        setIsReconnecting(false);
      }
    }, 15000); // 15 second timeout
  }, [isReconnecting, connectionStatus]);

  // Socket event handlers
  const handleSendOffer = useCallback(
    ({ roomId }: { roomId: string }) => {
      setLobby(false);
      webRTC.createSendingPeerConnection(roomId);
    },
    [webRTC]
  );

  const handleOffer = useCallback(
    async ({
      roomId,
      sdp,
    }: {
      roomId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      setLobby(false);
      try {
        await webRTC.createReceivingPeerConnection(roomId, sdp);
      } catch (error) {
        console.error("Error creating receiving peer connection:", error);
        setConnectionError("Failed to establish connection. Please try again.");
        handleReconnect();
      }
    },
    [webRTC, handleReconnect]
  );

  const handleAnswer = useCallback(
    ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      setLobby(false);
      try {
        webRTC.handleAnswer(sdp);
      } catch (error) {
        console.error("Error handling answer:", error);
        setConnectionError("Failed to complete connection. Please try again.");
        handleReconnect();
      }
    },
    [webRTC, handleReconnect]
  );

  const handleLobby = useCallback(() => {
    setLobby(true);
    setConnectionStatus("connecting");
    setConnectionError(null);
    setIsReconnecting(false);
  }, []);

  const handleAddIceCandidate = useCallback(
    ({
      candidate,
      type,
    }: {
      candidate: RTCIceCandidateInit;
      type: "sender" | "receiver";
    }) => {
      try {
        webRTC.addIceCandidate(candidate, type);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
        // Don't set error here as this is not always critical
      }
    },
    [webRTC]
  );

  // Initialize Socket
  const socket = useSocket({
    name,
    onSendOffer: handleSendOffer,
    onOffer: handleOffer,
    onAnswer: handleAnswer,
    onLobby: handleLobby,
    onAddIceCandidate: handleAddIceCandidate,
    setConnectionError,
  });

  // Update WebRTC with socket
  useEffect(() => {
    if (socket) {
      webRTC.setSocket(socket);
      console.log("Socket connected, WebRTC ready");
    }
  }, [socket, webRTC]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Update local video when track changes
  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      const stream = new MediaStream([localVideoTrack]);
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch((e) => {
        console.error("Error playing local video:", e);
      });
    }
  }, [localVideoTrack]);

  // Replace tracks in peer connection when they change
  useEffect(() => {
    if (localVideoTrack) {
      webRTC.replaceTrack(localVideoTrack, "video");
    }
  }, [localVideoTrack, webRTC]);

  useEffect(() => {
    if (localAudioTrack) {
      webRTC.replaceTrack(localAudioTrack, "audio");
    }
  }, [localAudioTrack, webRTC]);

  // UI Handlers
  const handleEndChat = () => {
    navigate("/");
  };

  const handleNextStranger = () => {
    // Reset state before finding next stranger
    setLobby(true);
    setConnectionStatus("connecting");
    setConnectionError(null);
    setIsReconnecting(false);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    window.location.reload();
  };

  const handleRefresh = () => {
    handleReconnect();
  };

  // Render connection status overlay for remote video
  const renderRemoteVideoOverlay = () => {
    if (lobby) {
      return <LoadingIndicator message="Looking for someone..." />;
    }

    if (connectionStatus === "connecting" || isReconnecting) {
      return (
        <LoadingIndicator
          message={
            isReconnecting ? "Reconnecting..." : "Connecting to stranger..."
          }
        />
      );
    }

    if (connectionStatus === "failed") {
      return (
        <div className="text-center bg-black/50 p-3 rounded">
          <div className="text-sm text-white mb-2">
            {connectionError || "Connection failed"}
          </div>
          <button
            onClick={handleNextStranger}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Try Another Person
          </button>
        </div>
      );
    }

    // Show debug info if connected but no video
    if (connectionStatus === "connected" && !webRTC.remoteVideoTrack) {
      return (
        <div className="text-center bg-black/50 p-3 rounded">
          <div className="text-sm text-white mb-2">
            Connected but waiting for video...
          </div>
          <div className="text-xs text-gray-300">
            Debug: Remote video track: {webRTC.remoteVideoTrack ? "✓" : "✗"} |
            Remote audio track: {webRTC.remoteAudioTrack ? "✓" : "✗"}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <RoomHeader onEndChat={handleEndChat} />

      <ConnectionStatusBar
        connectionError={connectionError}
        onRefresh={handleRefresh}
      />

      <main className="flex-1 p-4 bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
            <VideoDisplay
              videoRef={remoteVideoRef}
              label="Stranger"
              overlay={renderRemoteVideoOverlay()}
            />

            <VideoDisplay videoRef={localVideoRef} label="You" />
          </div>

          <MediaControls
            videoEnabled={videoEnabled}
            audioEnabled={audioEnabled}
            onToggleVideo={onToggleVideo}
            onToggleAudio={onToggleAudio}
            videoDevices={videoDevices}
            audioDevices={audioDevices}
            selectedVideoDeviceId={selectedVideoDeviceId}
            selectedAudioDeviceId={selectedAudioDeviceId}
            onSelectVideoDevice={onSelectVideoDevice}
            onSelectAudioDevice={onSelectAudioDevice}
            onNextStranger={handleNextStranger}
            onEndChat={handleEndChat}
          />

          {/* Mobile Info */}
          <div className="mt-3 text-center text-xs text-gray-500 sm:hidden">
            <p>Tap Next to find another person</p>
          </div>
        </div>
      </main>
    </div>
  );
};
