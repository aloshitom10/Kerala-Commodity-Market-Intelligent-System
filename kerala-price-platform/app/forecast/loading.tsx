import { Shimmer, CardSkeleton } from "@/components/Skeletons";

export default function ForecastLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Shimmer className="h-7 w-56 mb-2" />
          <Shimmer className="h-4 w-96" />
        </div>
        <Shimmer className="h-9 w-24 rounded-lg" />
      </div>

      {/* Commodity pills */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
        <Shimmer className="h-3 w-32 mb-3" />
        <div className="flex flex-wrap gap-2">
          {[...Array(10)].map((_, i) => (
            <Shimmer key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Price cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
      </div>

      {/* Chart card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
        <div className="flex border-b border-gray-200 px-5 pt-4 gap-1">
          {[1, 2, 3].map((i) => <Shimmer key={i} className="h-9 w-28 rounded-t-lg" />)}
        </div>
        <div className="p-5">
          <Shimmer className="h-5 w-48 mb-4" />
          <Shimmer className="h-72 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
