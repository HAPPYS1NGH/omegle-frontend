interface RoomHeaderProps {
  onEndChat: () => void;
}

export const RoomHeader = ({ onEndChat }: RoomHeaderProps) => {
  return (
    <header className="border-b bg-white dark:bg-neutral-900">
      <div className="flex h-14 items-center justify-between px-4">
        <h1 className="text-xl font-bold">Showcast</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800 font-semibold"
          onClick={onEndChat}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
          <span className="hidden sm:inline">End Chat</span>
          <span className="sm:hidden">End</span>
        </button>
      </div>
    </header>
  );
};
