import React, { useEffect, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface DeviceControlsProps {
  stream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  videoDevices: MediaDevice[];
  audioDevices: MediaDevice[];
  selectedVideoDeviceId: string;
  selectedAudioDeviceId: string;
  onSelectVideoDevice: (deviceId: string) => void;
  onSelectAudioDevice: (deviceId: string) => void;
  showPreview?: boolean;
  onNextStranger?: () => void;
  onEndChat?: () => void;
}

const chevronSvg = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
);

const DeviceControls: React.FC<DeviceControlsProps> = ({
  stream,
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
  showPreview = true,
  onNextStranger,
  onEndChat,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-full flex flex-col items-center gap-2 mt-4">
      {/* Controls Row */}
      <div className="flex flex-row items-center justify-center gap-6 w-full">
        {/* Video Icon + Dropdown */}
        <div className="flex flex-row items-center gap-1">
          <button
            onClick={onToggleVideo}
            className={`flex items-center justify-center w-12 h-12 rounded-full border transition focus:outline-none ${videoEnabled ? 'bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800' : 'bg-neutral-800 text-white border-neutral-700'}`}
            aria-label={videoEnabled ? 'Disable Video' : 'Enable Video'}
          >
            {videoEnabled ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="15" height="10" rx="2"/><polygon points="17 7 22 12 17 17 17 7"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="15" height="10" rx="2"/><polygon points="17 7 22 12 17 17 17 7"/><line x1="1" y1="1" x2="23" y2="23" stroke="#ea4335" strokeWidth="2.5"/></svg>
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 focus:outline-none ml-1"
                aria-label="Select Camera"
                tabIndex={0}
              >
                {chevronSvg}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" sideOffset={8} className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl min-w-[180px]">
              {videoDevices.map(device => (
                <DropdownMenuItem
                  key={device.deviceId}
                  onSelect={() => onSelectVideoDevice(device.deviceId)}
                  className={selectedVideoDeviceId === device.deviceId ? "font-semibold text-blue-500" : ""}
                >
                  {device.label || `Camera (${device.deviceId})`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Audio Icon + Dropdown */}
        <div className="flex flex-row items-center gap-1">
          <button
            onClick={onToggleAudio}
            className={`flex items-center justify-center w-12 h-12 rounded-full border transition focus:outline-none ${audioEnabled ? 'bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800' : 'bg-neutral-800 text-white border-neutral-700'}`}
            aria-label={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {audioEnabled ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/><line x1="1" y1="1" x2="23" y2="23" stroke="#ea4335" strokeWidth="2.5"/></svg>
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 focus:outline-none ml-1"
                aria-label="Select Microphone"
                tabIndex={0}
              >
                {chevronSvg}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" sideOffset={8} className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl min-w-[180px]">
              {audioDevices.map(device => (
                <DropdownMenuItem
                  key={device.deviceId}
                  onSelect={() => onSelectAudioDevice(device.deviceId)}
                  className={selectedAudioDeviceId === device.deviceId ? "font-semibold text-blue-500" : ""}
                >
                  {device.label || `Microphone (${device.deviceId})`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Next Stranger (optional, not in this row) */}
      </div>
      {/* End Chat Button on a new line */}
      <div className="w-full flex flex-row items-center justify-center mt-2">
        <button
          onClick={onEndChat}
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-red-500 text-white text-lg font-semibold transition hover:bg-red-600 focus:outline-none"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
          <span>End</span>
        </button>
      </div>
    </div>
  );
};

export default DeviceControls; 