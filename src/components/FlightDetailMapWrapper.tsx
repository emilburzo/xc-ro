"use client";

import dynamic from "next/dynamic";

const FlightDetailMap = dynamic(() => import("@/components/FlightDetailMap"), { ssr: false });

interface Props {
  lat: number;
  lng: number;
  label?: string;
}

export default function FlightDetailMapWrapper({ lat, lng, label }: Props) {
  return <FlightDetailMap lat={lat} lng={lng} label={label} />;
}
