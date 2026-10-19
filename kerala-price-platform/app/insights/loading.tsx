import { Shimmer } from "@/components/Skeletons";

export default function InsightsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Shimmer className="h-7 w-56 mb-2" />
          <Shimmer className="h-4 w-72" />
        </div>
        <Shimmer className="h-4 w-32" />
      </div>

      {/* Role banner */}
      <div className="rounded-xl border p-4 mb-6 bg-white">
        <Shimmer className="h-5 w-32 mb-2" />
        <Shimmer className="h-4 w-64" />
      </div>

      {/* Gainers / Decliners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {[1, 2].map((col) => (
          <div key={col} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <Shimmer className="h-5 w-32" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Shimmer className="h-8 w-8 rounded-full" />
                  <div>
                    <Shimmer className="h-4 w-24 mb-1" />
                    <Shimmer className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right">
                  <Shimmer className="h-4 w-20 mb-1" />
                  <Shimmer className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <Shimmer className="h-5 w-64" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-t border-gray-100">
            <Shimmer className="h-8 w-8 rounded-full flex-shrink-0" />
            <Shimmer className="h-4 flex-1" />
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
