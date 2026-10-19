import { Shimmer, CardSkeleton } from "@/components/Skeletons";

export default function TrendsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Shimmer className="h-7 w-64 mb-2" />
        <Shimmer className="h-4 w-80" />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Shimmer className="h-3 w-16 mb-2" />
              <Shimmer className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
      </div>

      {/* Chart area */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <Shimmer className="h-5 w-48 mb-4" />
        <Shimmer className="h-80 w-full rounded-lg" />
      </div>
    </div>
  );
}
