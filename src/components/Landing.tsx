import React, { useEffect, useRef } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
interface MediaDevice {
  deviceId: string;
  label: string;
}

interface LandingProps {
  setJoined: (joined: boolean) => void;
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
}

function getRandomName() {
  const animals = ["Lion", "Tiger", "Bear", "Wolf", "Fox", "Eagle", "Shark", "Panther", "Falcon", "Leopard", "Otter", "Hawk", "Moose", "Bison", "Cobra", "Jaguar", "Puma", "Raven", "Viper", "Lynx"];
  const adjectives = ["Brave", "Swift", "Clever", "Fierce", "Mighty", "Nimble", "Bold", "Silent", "Wild", "Lucky", "Gentle", "Sly", "Lone", "Daring", "Noble", "Quick", "Calm", "Sharp", "Wise", "Chill"];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adj}${animal}${Math.floor(Math.random() * 1000)}`;
}

export const Landing: React.FC<LandingProps> = ({
  setJoined,
  stream,
  videoEnabled,
  audioEnabled,
  onToggleVideo,
  onToggleAudio,
  videoDevices = [],
  audioDevices = [],
  selectedVideoDeviceId,
  selectedAudioDeviceId,
  onSelectVideoDevice,
  onSelectAudioDevice
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    // Set video preview
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Set random name on mount (could be lifted to App if needed)
  useEffect(() => {
    getRandomName(); // Just generate, don't assign to window
  }, []);

  // chevron svg
  const chevronSvg = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
  );

  // DropdownMenu imports (copied from Room)
  // @ts-ignore

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-white dark:bg-neutral-900">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Showcast</h1>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 p-4 bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-full flex flex-col md:flex-row gap-6 items-center justify-center">
            {/* Video Preview Card */}
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden w-full max-w-md flex items-center justify-center">
              <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-xs text-white rounded">You</div>
            </div>
            {/* Card for join */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 flex flex-col gap-4 w-full max-w-sm items-center justify-center">
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Ready to join?</div>
              {/* Controls (same as Room) */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
                {/* Video Dropdown */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={onToggleVideo}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border transition focus:outline-none ${videoEnabled ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                    aria-label={videoEnabled ? 'Disable Video' : 'Enable Video'}
                  >
                    {videoEnabled ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="15" height="10" rx="2"/><polygon points="17 7 22 12 17 17 17 7"/></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="15" height="10" rx="2"/><polygon points="17 7 22 12 17 17 17 7"/><line x1="1" y1="1" x2="23" y2="23" stroke="#ea4335" strokeWidth="2.5"/></svg>
                    )}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 focus:outline-none"
                        aria-label="Select Camera"
                        tabIndex={0}
                      >
                        {chevronSvg}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" sideOffset={8} className="bg-white border border-blue-200 rounded-xl shadow-xl min-w-[180px]">
                      { videoDevices.length > 0 && videoDevices.map(device => (
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
                {/* Audio Dropdown */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={onToggleAudio}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border transition focus:outline-none ${audioEnabled ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                    aria-label={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {audioEnabled ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/><line x1="1" y1="1" x2="23" y2="23" stroke="#ea4335" strokeWidth="2.5"/></svg>
                    )}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 focus:outline-none"
                        aria-label="Select Microphone"
                        tabIndex={0}
                      >
                        {chevronSvg}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" sideOffset={8} className="bg-white border border-blue-200 rounded-xl shadow-xl min-w-[180px]">
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
              </div>
              <button
                onClick={() => setJoined(true)}
                className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition w-full"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};