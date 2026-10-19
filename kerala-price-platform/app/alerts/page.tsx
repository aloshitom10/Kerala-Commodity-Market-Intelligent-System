"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Price alerts have been removed as per the updated design.
// Users are redirected to Market Insights which provides
// role-specific actionable market intelligence.
export default function AlertsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/insights"); }, [router]);
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400 text-sm">
      Redirecting to Market Insights…
    </div>
  );
}
