interface LoadingIndicatorProps {
  message: string;
}

export const LoadingIndicator = ({ message }: LoadingIndicatorProps) => {
  return (
    <div className="text-center">
      <div className="mb-2 text-sm text-white">{message}</div>
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
    </div>
  );
};
