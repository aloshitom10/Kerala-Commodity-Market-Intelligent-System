/**
 * KeramPulse logo — an inline SVG mark.
 * A stylised "KP" monogram inside a leaf/pulse shape.
 * Renders at any size via the `size` prop (default 36).
 */
export default function KPLogo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="KeramPulse logo"
    >
      {/* Leaf background */}
      <path
        d="M24 4C13.5 4 5 12.5 5 23c0 5.8 2.6 11 6.7 14.5L24 44l12.3-6.5C40.4 34 43 28.8 43 23 43 12.5 34.5 4 24 4z"
        fill="#15803d"
      />
      {/* Subtle inner leaf highlight */}
      <path
        d="M24 9C15.7 9 9 15.7 9 24c0 3.8 1.4 7.3 3.7 10L24 39l11.3-5C37.6 31.3 39 27.8 39 24 39 15.7 32.3 9 24 9z"
        fill="#16a34a"
        opacity="0.5"
      />
      {/* Pulse / heartbeat line */}
      <polyline
        points="10,24 16,24 19,18 22,30 25,22 28,26 31,24 38,24"
        stroke="#bbf7d0"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
