import dynamic from "next/dynamic";

const RadialPlayground = dynamic(
  () => import("@radial-waveform/components/RadialPlayground"),
  { ssr: false }
);

export default function RadialPlaygroundRoute() {
  return <RadialPlayground />;
}
