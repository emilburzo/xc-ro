/** Shared row shape returned by takeoff/similar-flight queries and consumed by TakeoffFlightsTable. */
export interface FlightRow {
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
