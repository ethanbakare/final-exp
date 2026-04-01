import dynamic from "next/dynamic";

const GalleryScene = dynamic(
  () => import("@blob-orb/components/GalleryScene"),
  { ssr: false }
);

export default function GalleryRoute() {
  return <GalleryScene />;
}
