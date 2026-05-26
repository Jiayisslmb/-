import Card from '@/components/ui/Card';

export default function Loading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full skeleton" />
            <div className="space-y-2">
              <div className="h-4 w-24 skeleton rounded" />
              <div className="h-3 w-16 skeleton rounded" />
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-4 w-full skeleton rounded" />
            <div className="h-4 w-3/4 skeleton rounded" />
          </div>
          <div className="h-48 skeleton rounded-xl mb-3" />
          <div className="flex gap-4 pt-3 border-t border-gray-50">
            <div className="h-8 w-16 skeleton rounded-lg" />
            <div className="h-8 w-16 skeleton rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}
