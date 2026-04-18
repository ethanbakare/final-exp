import dynamic from "next/dynamic";

const LinearLab = dynamic(
  () => import("@/projects/voiceinterface/linear-waveform/components/LinearPlayground"),
  { ssr: false }
);

export default function LinearLabRoute() {
  return <LinearLab />;
}
