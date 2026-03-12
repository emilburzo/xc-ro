"use client";

import dynamic from "next/dynamic";

const PilotsGrowthChart = dynamic(() => import("./charts/PilotsGrowthChart"), { ssr: false });

interface PilotsGrowthData {
  year: number;
  active_pilots: number;
  new_pilots: number;
  cumulative_pilots: number;
}

interface Props {
  data: PilotsGrowthData[];
  activePilotsLabel?: string;
  newPilotsLabel?: string;
  cumulativePilotsLabel?: string;
}

export default function PilotsGrowthWrapper({ data, activePilotsLabel, newPilotsLabel, cumulativePilotsLabel }: Props) {
  return <PilotsGrowthChart data={data} activePilotsLabel={activePilotsLabel} newPilotsLabel={newPilotsLabel} cumulativePilotsLabel={cumulativePilotsLabel} />;
}
