import { RefObject, ReactNode } from "react";

interface VideoDisplayProps {
  videoRef: RefObject<HTMLVideoElement>;
  label: string;
  overlay?: ReactNode;
  className?: string;
}

export const VideoDisplay = ({
  videoRef,
  label,
  overlay,
  className = "",
}: VideoDisplayProps) => {
  return (
    <div
      className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted={label === "You"}
        className="w-full h-full object-cover"
      />
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          {overlay}
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-xs text-white rounded">
        {label}
      </div>
    </div>
  );
};
