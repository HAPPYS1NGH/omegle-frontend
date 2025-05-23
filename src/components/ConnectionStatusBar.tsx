interface ConnectionStatusBarProps {
  connectionError: string | null;
  onRefresh: () => void;
}

export const ConnectionStatusBar = ({
  connectionError,
  onRefresh,
}: ConnectionStatusBarProps) => {
  if (!connectionError) return null;

  return (
    <div className="bg-yellow-500 text-white text-center py-2 px-4">
      <p className="text-sm font-medium">{connectionError}</p>
      <button
        onClick={onRefresh}
        className="text-xs underline hover:no-underline ml-2"
      >
        Refresh
      </button>
    </div>
  );
};
