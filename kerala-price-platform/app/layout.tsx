import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { LangProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "KeramPulse — Kerala Commodity Market Intelligence",
  description: "KeramPulse: Real-time wholesale commodity price monitoring, trends, forecasts and insights across all 14 Kerala districts.",
};

const API_ORIGIN =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api")
    .replace(/\/api\/?$/, "");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to API so the first fetch has no cold-connection overhead */}
        <link rel="preconnect" href={API_ORIGIN} />
        <link rel="dns-prefetch" href={API_ORIGIN} />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <LangProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <footer className="bg-green-900 text-green-100 text-center py-4 text-sm mt-8">
            © 2024 <strong>KeramPulse</strong> · Kerala Commodity Market Intelligence · Built for farmers, traders &amp; consumers
          </footer>
        </LangProvider>
      </body>
    </html>
  );
}
