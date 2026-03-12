import Link from "next/link";
import { pilotPath, takeoffPath, flightPath, formatDuration, formatDistance, formatDate } from "@/lib/utils";

interface WingFlight {
  id: number;
  start_time: string;
  distance_km: number;
  score: number;
  airtime: number;
  pilot_name: string;
  pilot_username: string;
  takeoff_name: string | null;
  takeoff_id: number | null;
}

interface WingFlightsTableProps {
  title: string;
  flights: WingFlight[];
  locale: string;
  labels: {
    date: string;
    pilot: string;
    takeoff: string;
    distance: string;
    score: string;
    airtime: string;
  };
}

export default function WingFlightsTable({ title, flights, locale, labels }: WingFlightsTableProps) {
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
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">{labels.takeoff}</th>
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
                  <Link href={flightPath(f.id, f.pilot_name, f.takeoff_name)} className="hover:underline">
                    {formatDate(f.start_time, locale)}
                  </Link>
                </td>
                <td className="px-2 py-2">
                  <Link href={pilotPath(f.pilot_username)} className="text-blue-600 hover:underline">
                    {f.pilot_name}
                  </Link>
                </td>
                <td className="px-2 py-2">
                  {f.takeoff_id ? (
                    <Link href={takeoffPath(f.takeoff_id, f.takeoff_name!)} className="text-blue-600 hover:underline">
                      {f.takeoff_name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
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
