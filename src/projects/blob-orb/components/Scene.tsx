import React from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Orb from "./Orb";
import { AudioData, OrbConfig } from "../types";

interface SceneProps {
  audioData: AudioData;
  config: OrbConfig;
}

const Scene: React.FC<SceneProps> = ({ audioData, config }) => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#FFFFFF"]} />
        <ambientLight intensity={0.5} />
        <Orb audioData={audioData} config={config} />
        {/* Bloom reserved for audio-reactive glow — off at idle */}
        {config.bloomStrength > 0 && (
          <EffectComposer enableNormalPass={false}>
            <Bloom
              intensity={config.bloomStrength}
              luminanceThreshold={0.9}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
};

export default Scene;
