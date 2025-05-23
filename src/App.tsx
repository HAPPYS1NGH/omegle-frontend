import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing } from "./components/Landing";
import { Room } from "./components/Room";

interface MediaDevice {
  deviceId: string;
  label: string;
}

function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] =
    useState<string>("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] =
    useState<string>("");
  const [permissionError, setPermissionError] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // Enumerate devices and set initial selections (after permission)
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("[Device Enumeration] Raw devices:", devices);
      const videoInputs = devices
        .filter((d) => d.kind === "videoinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label }));
      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({ deviceId: d.deviceId, label: d.label }));
      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);
      setLoadingDevices(false);
      console.log(`[Device Enumeration] Video Inputs:`, videoInputs);
      console.log(`[Device Enumeration] Audio Inputs:`, audioInputs);
      if (!selectedVideoDeviceId && videoInputs.length > 0) {
        setSelectedVideoDeviceId(videoInputs[0].deviceId);
        console.log(
          `[Device Enumeration] Defaulting video device to:`,
          videoInputs[0].deviceId
        );
      }
      if (!selectedAudioDeviceId && audioInputs.length > 0) {
        setSelectedAudioDeviceId(audioInputs[0].deviceId);
        console.log(
          `[Device Enumeration] Defaulting audio device to:`,
          audioInputs[0].deviceId
        );
      }
    } catch (err) {
      console.error("[Device Enumeration] Error enumerating devices:", err);
    }
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  // Get stream with selected devices
  const getStream = useCallback(
    async (videoId: string, audioId: string) => {
      try {
        setPermissionError(false);
        setLoadingDevices(true);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        const constraints: MediaStreamConstraints = {
          video: videoId ? { deviceId: { exact: videoId } } : true,
          audio: audioId ? { deviceId: { exact: audioId } } : true,
        };
        console.log(
          `[getStream] Requesting stream with constraints:`,
          constraints
        );
        const mediaStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        setStream(mediaStream);
        const videoTrack = mediaStream.getVideoTracks()[0] || null;
        const audioTrack = mediaStream.getAudioTracks()[0] || null;
        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);
        setVideoEnabled(videoTrack ? videoTrack.enabled : false);
        setAudioEnabled(audioTrack ? audioTrack.enabled : false);
        console.log(
          `[getStream] Got stream. Video track:`,
          videoTrack,
          "Audio track:",
          audioTrack
        );
        await enumerateDevices(); // Only enumerate after permission granted
      } catch (err) {
        setPermissionError(true);
        setLoadingDevices(false);
        console.error(`[getStream] Error getting user media:`, err);
      }
    },
    [stream, enumerateDevices]
  );

  // Initial getUserMedia on mount
  useEffect(() => {
    getStream("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When device selection changes, get new stream
  useEffect(() => {
    if (
      selectedVideoDeviceId &&
      selectedAudioDeviceId &&
      !loadingDevices &&
      !permissionError
    ) {
      getStream(selectedVideoDeviceId, selectedAudioDeviceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideoDeviceId, selectedAudioDeviceId]);

  // Re-enumerate devices when permissions change
  useEffect(() => {
    navigator.mediaDevices.addEventListener("devicechange", enumerateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        enumerateDevices
      );
    };
  }, [enumerateDevices]);

  const handleToggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
        setVideoEnabled(track.enabled);
        console.log(`[Toggle] Video track enabled:`, track.enabled);
      });
    }
  };

  const handleToggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
        setAudioEnabled(track.enabled);
        console.log(`[Toggle] Audio track enabled:`, track.enabled);
      });
    }
  };

  const handleSelectVideoDevice = (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
    console.log(`[Selection] User selected video device:`, deviceId);
  };

  const handleSelectAudioDevice = (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    console.log(`[Selection] User selected audio device:`, deviceId);
  };

  const handleGrantAccess = () => {
    getStream("", "");
  };

  return (
    <div>
      {permissionError ? (
        <div style={{ color: "red", margin: 16 }}>
          <p>
            Camera and/or microphone access denied. Please grant access to use
            this app.
          </p>
          <button onClick={handleGrantAccess}>Grant Access</button>
        </div>
      ) : null}
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              !joined ? (
                <Landing
                  setJoined={setJoined}
                  stream={stream}
                  videoEnabled={videoEnabled}
                  audioEnabled={audioEnabled}
                  onToggleVideo={handleToggleVideo}
                  onToggleAudio={handleToggleAudio}
                  videoDevices={videoDevices}
                  audioDevices={audioDevices}
                  selectedVideoDeviceId={selectedVideoDeviceId}
                  selectedAudioDeviceId={selectedAudioDeviceId}
                  onSelectVideoDevice={handleSelectVideoDevice}
                  onSelectAudioDevice={handleSelectAudioDevice}
                />
              ) : (
                <Room
                  name={name}
                  localAudioTrack={localAudioTrack}
                  localVideoTrack={localVideoTrack}
                  videoEnabled={videoEnabled}
                  audioEnabled={audioEnabled}
                  onToggleVideo={handleToggleVideo}
                  onToggleAudio={handleToggleAudio}
                  videoDevices={videoDevices}
                  audioDevices={audioDevices}
                  selectedVideoDeviceId={selectedVideoDeviceId}
                  selectedAudioDeviceId={selectedAudioDeviceId}
                  onSelectVideoDevice={handleSelectVideoDevice}
                  onSelectAudioDevice={handleSelectAudioDevice}
                />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
