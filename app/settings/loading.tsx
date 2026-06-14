export default function SettingsLoading() {
  return (
    <div className="flex flex-col md:flex-row gap-6 animate-pulse">
      <div className="hidden md:block w-56 lg:w-64 shrink-0">
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-[var(--mastodon-border)] rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 max-w-3xl space-y-4">
        <div className="h-8 w-48 bg-[var(--mastodon-border)] rounded-lg" />
        <div className="h-1 w-24 bg-gradient-to-r from-[#6364FF] to-transparent rounded-full" />
        <div className="space-y-4 mt-6">
          <div className="h-64 bg-[var(--mastodon-border)] rounded-xl" />
          <div className="h-48 bg-[var(--mastodon-border)] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
