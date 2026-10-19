import { Shimmer, CardSkeleton } from "@/components/Skeletons";

export default function PricesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Shimmer className="h-7 w-64 mb-2" />
          <Shimmer className="h-4 w-80" />
        </div>
        <Shimmer className="h-9 w-24 rounded-lg" />
      </div>

      {/* Selector bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Shimmer className="h-3 w-20 mb-2" />
              <Shimmer className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Price cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
      </div>

      {/* Info banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <Shimmer className="h-4 w-48 mb-2" />
        <Shimmer className="h-3 w-64" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <Shimmer className="h-5 w-56" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-t border-gray-100">
            <Shimmer className="h-4 w-6 rounded-full" />
            <Shimmer className="h-4 flex-1" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
