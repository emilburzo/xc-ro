"use client";

import dynamic from "next/dynamic";

const CommunityGrowthChart = dynamic(() => import("./charts/CommunityGrowthChart"), { ssr: false });

interface GrowthData {
  year: number;
  new_pilots: number;
  cumulative_pilots: number;
  flight_count: number;
}

interface CommunityGrowthWrapperProps {
  data: GrowthData[];
  newPilotsLabel?: string;
  cumulativePilotsLabel?: string;
  flightsLabel?: string;
}

export default function CommunityGrowthWrapper({ data, newPilotsLabel, cumulativePilotsLabel, flightsLabel }: CommunityGrowthWrapperProps) {
  return <CommunityGrowthChart data={data} newPilotsLabel={newPilotsLabel} cumulativePilotsLabel={cumulativePilotsLabel} flightsLabel={flightsLabel} />;
}
