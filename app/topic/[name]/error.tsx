'use client';

export default function TopicError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-center py-16">
      <p className="text-gray-500 mb-4">话题加载失败</p>
      <button
        onClick={reset}
        className="text-[#6364FF] font-medium hover:underline"
      >
        重试
      </button>
    </div>
  );
}
