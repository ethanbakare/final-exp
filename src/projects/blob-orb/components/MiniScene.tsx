/**
 * Lightweight Canvas wrapper for each variant cell in the comparison grid.
 * No Bloom — keeps GPU load manageable with 5 canvases.
 * Optional environment prop adds an HDRI environment for PBR materials.
 */
import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

interface MiniSceneProps {
  children: React.ReactNode;
  label: string;
  /** drei Environment preset name — adds HDRI for PBR reflections */
  environment?: string;
  /** Override the canvas background color (default: white) */
  background?: string;
}

const MiniScene: React.FC<MiniSceneProps> = ({ children, label, environment, background }) => {
  return (
    <div className="relative w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-md">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[background || "#FFFFFF"]} />
        <ambientLight intensity={0.5} />
        {environment && <Environment preset={environment as "studio"} />}
        {children}
      </Canvas>
      <div className="absolute bottom-3 left-0 w-full text-center">
        <span className="text-xs text-gray-400 font-medium tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
};

export default MiniScene;
