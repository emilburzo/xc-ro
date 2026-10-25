import type { FlightTypeKey } from "@/lib/utils";

interface FlightTypeIconProps {
  type: FlightTypeKey;
  /** Accessible name and tooltip; leave out when the type's name is written next to the icon. */
  label?: string;
  className?: string;
}

const FREE_FLIGHT = "M2 12c1.7-5 3.3-5 5 0s3.3 5 5 0 3.3-5 5 0h4m-3-3 3 3-3 3";
const TRIANGLE = "M12 4.5 20.5 19h-17Z";

/** Route shape at a glance: a wavy arrow for free flights, an outlined triangle for flat ones, a filled one for FAI. */
export default function FlightTypeIcon({ type, label, className = "w-4 h-4" }: FlightTypeIconProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      title={label}
      className="inline-flex align-middle"
    >
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill={type === "fai" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={type === "free" ? FREE_FLIGHT : TRIANGLE} />
      </svg>
    </span>
  );
}
