export const CAT_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-red-100 text-red-800",
  Z: "bg-purple-100 text-purple-800",
  T: "bg-pink-100 text-pink-800",
};

const BAR_COLORS: Record<string, string> = {
  A: "bg-green-400",
  B: "bg-blue-400",
  C: "bg-yellow-400",
  D: "bg-red-400",
  Z: "bg-purple-400",
  T: "bg-pink-400",
};

interface EquipmentItem {
  name: string;
  category: string;
  flight_count: number;
  first_used: string;
  last_used: string;
}

interface Props {
  data: EquipmentItem[];
  flightsLabel?: string;
}

export default function CategoryTimeline({ data, flightsLabel = "flights" }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="text-center text-gray-400 py-6">No equipment data</p>
    );
  }

  const allDates = data.flatMap((d) => [
    new Date(d.first_used).getTime(),
    new Date(d.last_used).getTime(),
  ]);
  const globalMin = Math.min(...allDates);
  const globalMax = Math.max(...allDates);
  const range = globalMax - globalMin || 1;

  // Generate year labels — thin every other year on crowded timelines
  const minYear = new Date(globalMin).getFullYear();
  const maxYear = new Date(globalMax).getFullYear();
  const totalYears = maxYear - minYear + 1;
  const step = totalYears > 10 ? 3 : totalYears > 5 ? 2 : 1;
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y += step) {
    years.push(y);
  }
  // Always include last year if not already there
  if (years[years.length - 1] !== maxYear) {
    years.push(maxYear);
  }

  return (
    <div className="overflow-x-auto" data-testid="category-timeline">
      <div className="min-w-[360px] space-y-1">
        {data.map((g, i) => {
          const start = new Date(g.first_used).getTime();
          const end = new Date(g.last_used).getTime();
          const leftPct = ((start - globalMin) / range) * 100;
          const widthPct = ((end - start) / range) * 100;

          return (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-sm">
              {/* Label column — narrower on mobile */}
              <div className="w-24 sm:w-40 flex-shrink-0 flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span
                  className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${CAT_COLORS[g.category] || "bg-gray-100 text-gray-600"}`}
                >
                  {g.category}
                </span>
                <span className="text-gray-700 truncate text-xs sm:text-sm">{g.name}</span>
              </div>

              {/* Timeline bar column */}
              <div className="flex-1 relative h-5 sm:h-6">
                <div
                  className={`absolute top-0 h-full rounded ${BAR_COLORS[g.category] || "bg-gray-400"} flex items-center justify-center`}
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    minWidth: "8px",
                  }}
                  title={`${g.name} (${g.category}) — ${new Date(g.first_used).getFullYear()}–${new Date(g.last_used).getFullYear()} — ${g.flight_count} ${flightsLabel}`}
                >
                  <span className="text-[9px] text-white font-medium drop-shadow-sm px-0.5 whitespace-nowrap overflow-hidden">
                    {g.flight_count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Year axis */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-400">
          <div className="w-24 sm:w-40 flex-shrink-0" />
          <div className="flex-1 relative h-4">
            {years.map((y) => {
              const yStart = new Date(y, 0, 1).getTime();
              const pct = ((yStart - globalMin) / range) * 100;
              return (
                <span
                  key={y}
                  className="absolute text-[10px]"
                  style={{ left: `${Math.max(0, Math.min(pct, 95))}%` }}
                >
                  {y}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
