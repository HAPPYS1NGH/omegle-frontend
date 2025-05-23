import { DeviceSelector } from "./DeviceSelector";

interface Device {
  deviceId: string;
  label: string;
}

interface MediaControlsProps {
  videoEnabled: boolean;
  audioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  videoDevices: Device[];
  audioDevices: Device[];
  selectedVideoDeviceId: string;
  selectedAudioDeviceId: string;
  onSelectVideoDevice: (deviceId: string) => void;
  onSelectAudioDevice: (deviceId: string) => void;
  onNextStranger: () => void;
  onEndChat: () => void;
}

const VideoIcon = ({ enabled }: { enabled: boolean }) => {
  if (enabled) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="15" height="10" rx="2" />
        <polygon points="17 7 22 12 17 17 17 7" />
      </svg>
    );
  }
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ea4335"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="15" height="10" rx="2" />
      <polygon points="17 7 22 12 17 17 17 7" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="#ea4335" strokeWidth="2.5" />
    </svg>
  );
};

const AudioIcon = ({ enabled }: { enabled: boolean }) => {
  if (enabled) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    );
  }
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ea4335"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="#ea4335" strokeWidth="2.5" />
    </svg>
  );
};

export const MediaControls = ({
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
  onNextStranger,
  onEndChat,
}: MediaControlsProps) => {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
      {/* Video Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleVideo}
          className={`flex items-center justify-center w-12 h-12 rounded-full border transition focus:outline-none ${
            videoEnabled
              ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
              : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
          }`}
          aria-label={videoEnabled ? "Disable Video" : "Enable Video"}
        >
          <VideoIcon enabled={videoEnabled} />
        </button>
        <DeviceSelector
          devices={videoDevices}
          selectedDeviceId={selectedVideoDeviceId}
          onSelectDevice={onSelectVideoDevice}
          type="video"
        />
      </div>

      {/* Audio Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleAudio}
          className={`flex items-center justify-center w-12 h-12 rounded-full border transition focus:outline-none ${
            audioEnabled
              ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
              : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
          }`}
          aria-label={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
        >
          <AudioIcon enabled={audioEnabled} />
        </button>
        <DeviceSelector
          devices={audioDevices}
          selectedDeviceId={selectedAudioDeviceId}
          onSelectDevice={onSelectAudioDevice}
          type="audio"
        />
      </div>

      {/* Action Buttons */}
      <button
        onClick={onNextStranger}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border bg-white text-blue-700 border-blue-300 hover:bg-blue-50 transition"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span>Next</span>
      </button>

      <button
        onClick={onEndChat}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border bg-red-500 text-white border-red-600 hover:bg-red-600 transition"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="6" y1="18" x2="18" y2="6" />
        </svg>
        <span>End</span>
      </button>
    </div>
  );
};
