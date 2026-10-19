import { Shimmer } from "@/components/Skeletons";

export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Shimmer className="h-7 w-64 mb-2" />
        <Shimmer className="h-4 w-80" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <Shimmer className="h-3 w-20 mb-2" />
              <Shimmer className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Results table skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <Shimmer className="h-5 w-40" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-t border-gray-100">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-24 ml-auto" />
            <Shimmer className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
