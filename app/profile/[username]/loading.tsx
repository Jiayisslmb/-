export default function ProfileLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <div key={i} className="h-8 w-16 bg-gray-200 rounded-lg" />)}
      </div>
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
}
