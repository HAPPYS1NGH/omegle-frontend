import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

interface Device {
  deviceId: string;
  label: string;
}

interface DeviceSelectorProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  type: "video" | "audio";
}

const chevronSvg = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const DeviceSelector = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  type,
}: DeviceSelectorProps) => {
  const deviceTypeLabel = type === "video" ? "Camera" : "Microphone";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 focus:outline-none"
          aria-label={`Select ${deviceTypeLabel}`}
          tabIndex={0}
        >
          {chevronSvg}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={8}
        className="bg-white border border-blue-200 rounded-xl shadow-xl min-w-[180px]"
      >
        {devices.map((device) => (
          <DropdownMenuItem
            key={device.deviceId}
            onSelect={() => onSelectDevice(device.deviceId)}
            className={
              selectedDeviceId === device.deviceId
                ? "font-semibold text-blue-500"
                : ""
            }
          >
            {device.label || `${deviceTypeLabel} (${device.deviceId})`}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
