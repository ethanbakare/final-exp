/**
 * Full-screen scene for the morph experiment.
 * Single GentleOrbMorph variant with toggle button.
 */
import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AudioData } from "../types";
import { DEFAULT_CONFIG } from "../constants";
import GentleOrbMorph from "../variants/archived/GentleOrbMorph";

const config = {
  ...DEFAULT_CONFIG,
  maxDisplacement: 0.18,
};

const MorphScene: React.FC = () => {
  const [audioData] = useState<AudioData>({
    bass: 0,
    mid: 0,
    treble: 0,
    rms: 0,
  });

  const [isInfinity, setIsInfinity] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <h1 className="text-xl font-semibold text-gray-800 mb-1">
        Shape Morph
      </h1>
      <p className="text-center text-xs text-gray-400 mb-6">
        Toggle between torus and infinity
      </p>

      <div className="relative w-full max-w-xl aspect-square bg-white rounded-2xl overflow-hidden shadow-md">
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <color attach="background" args={["#FFFFFF"]} />
          <ambientLight intensity={0.5} />
          <GentleOrbMorph
            audioData={audioData}
            config={config}
            goal={isInfinity ? 1 : 0}
          />
        </Canvas>
      </div>

      <button
        onClick={() => setIsInfinity((p) => !p)}
        className="mt-6 px-6 py-2 rounded-full border border-gray-200 bg-white text-gray-500 text-sm font-medium shadow-sm hover:shadow-md hover:text-gray-700 transition-all cursor-pointer"
      >
        {isInfinity ? "⟲ Torus" : "∞ Infinity"}
      </button>
    </div>
  );
};

export default MorphScene;
