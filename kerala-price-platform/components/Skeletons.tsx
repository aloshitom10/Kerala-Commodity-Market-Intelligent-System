// Shared skeleton shimmer component used by all loading.tsx files
export function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${className ?? ""}`}>
      <Shimmer className="h-3 w-24 mb-3" />
      <Shimmer className="h-8 w-32 mb-2" />
      <Shimmer className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <Shimmer className="h-5 w-48" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-5 py-3"><Shimmer className="h-3 w-full" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-t border-gray-100">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-5 py-3"><Shimmer className="h-4 w-full" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
