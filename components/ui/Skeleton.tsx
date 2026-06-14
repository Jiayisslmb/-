export default function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[var(--mastodon-border)] rounded-full" />
        <div className="h-4 bg-[var(--mastodon-border)] rounded w-32" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-[var(--mastodon-border)] rounded w-3/4" />
        <div className="h-4 bg-[var(--mastodon-border)] rounded w-full" />
        <div className="h-4 bg-[var(--mastodon-border)] rounded w-1/2" />
      </div>
      <div className="h-48 bg-[var(--mastodon-border)] rounded-xl" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[var(--mastodon-border)] rounded-full" />
        <div className="h-3 bg-[var(--mastodon-border)] rounded w-24" />
      </div>
      <div className="h-4 bg-[var(--mastodon-border)] rounded w-3/4" />
      <div className="h-4 bg-[var(--mastodon-border)] rounded w-full" />
      <div className="h-36 bg-[var(--mastodon-border)] rounded-lg" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-end gap-4">
        <div className="w-24 h-24 bg-[var(--mastodon-border)] rounded-full" />
        <div className="space-y-2">
          <div className="h-5 bg-[var(--mastodon-border)] rounded w-32" />
          <div className="h-4 bg-[var(--mastodon-border)] rounded w-48" />
        </div>
      </div>
      <div className="h-10 bg-[var(--mastodon-border)] rounded-lg w-full" />
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
