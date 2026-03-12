import Link from "next/link";
import { pilotPath, flightPath, formatDuration, formatDistance, formatDate } from "@/lib/utils";

interface TakeoffFlightRow {
  id: number;
  start_time: string;
  distance_km: number;
  score: number;
  airtime: number;
  pilot_name: string;
  pilot_username: string;
  glider_name: string;
  glider_category: string;
}

interface TakeoffFlightsTableProps {
  title: string;
  flights: TakeoffFlightRow[];
  locale: string;
  takeoffName: string;
  labels: {
    date: string;
    pilot: string;
    glider: string;
    distance: string;
    score: string;
    airtime: string;
  };
}

export default function TakeoffFlightsTable({ title, flights, locale, takeoffName, labels }: TakeoffFlightsTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">#</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{labels.date}</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{labels.pilot}</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{labels.glider}</th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{labels.distance}</th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{labels.score}</th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">{labels.airtime}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {flights.map((f, i) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-2 py-2 text-gray-500">{i + 1}</td>
                <td className="px-2 py-2 text-gray-700 whitespace-nowrap">
                  <Link href={flightPath(f.id, f.pilot_name, takeoffName)} className="hover:underline">
                    {formatDate(f.start_time, locale)}
                  </Link>
                </td>
                <td className="px-2 py-2">
                  <Link href={pilotPath(f.pilot_username)} className="text-blue-600 hover:underline">
                    {f.pilot_name}
                  </Link>
                </td>
                <td className="px-2 py-2 text-gray-700">
                  {f.glider_name}
                  <span className="ml-1 px-1 py-0.5 bg-gray-100 rounded text-[10px]">{f.glider_category}</span>
                </td>
                <td className="px-2 py-2 font-medium text-right">{formatDistance(f.distance_km)} km</td>
                <td className="px-2 py-2 text-gray-700 text-right">{Number(f.score).toFixed(1)}</td>
                <td className="px-2 py-2 text-gray-500 text-right">{formatDuration(f.airtime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
