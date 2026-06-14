export default function MessagesLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-4">
      <div className="h-8 w-32 bg-[var(--mastodon-border)] rounded-lg" />
      <div className="flex gap-4">
        <div className="w-80 shrink-0 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[var(--mastodon-border)] rounded-xl" />
          ))}
        </div>
        <div className="flex-1 h-96 bg-[var(--mastodon-border)] rounded-xl" />
      </div>
    </div>
  );
}
