import * as THREE from "three";

/**
 * BreatheInterface-faithful GLSL orb.
 *
 * Vertex: near-perfect sphere with low-frequency spherical harmonic
 * deformation driven by audio. Idle state is a gentle breathing pulse.
 *
 * Fragment: replicates BreatheInterface's radial gradient (#FFF5F0 center,
 * #FFD6C0 mid, #FFC4C4 edge), top-left highlight, soft edge falloff.
 */

export const orbShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color("#FFF5F0") },
    uColor2: { value: new THREE.Color("#FFD6C0") },
    uColor3: { value: new THREE.Color("#FFC4C4") },
    /** Uniform breathing scale offset (idle + bass) */
    uBreathScale: { value: 0.0 },
    /** Low-order harmonic amplitudes driven by audio bands */
    uHarmonic0: { value: 0.0 },
    uHarmonic1: { value: 0.0 },
    uHarmonic2: { value: 0.0 },
    /** Phase offsets so harmonics drift over time */
    uPhase0: { value: 0.0 },
    uPhase1: { value: 0.0 },
    uPhase2: { value: 0.0 },
    /** Hard cap on total displacement */
    uMaxDisp: { value: 0.12 },
  },

  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldNormal;
    varying float vDisplacement;

    uniform float uTime;
    uniform float uBreathScale;
    uniform float uHarmonic0;
    uniform float uHarmonic1;
    uniform float uHarmonic2;
    uniform float uPhase0;
    uniform float uPhase1;
    uniform float uPhase2;
    uniform float uMaxDisp;

    void main() {
      vUv = uv;
      vWorldNormal = normalize(normal);
      vNormal = normalize(normalMatrix * normal);

      // Spherical coordinates from the vertex normal
      float theta = acos(clamp(normal.y, -1.0, 1.0));
      float phi = atan(normal.z, normal.x);

      // Uniform breathing — simple radial scale pulse
      float displacement = uBreathScale;

      // Low-order spherical harmonic deformations (smooth, global shapes)
      // Mode 0: Y_2^0 — axial bulge/pinch (like squeezing top/bottom)
      float y20 = 0.25 * (3.0 * normal.y * normal.y - 1.0);
      displacement += uHarmonic0 * y20 * sin(uPhase0);

      // Mode 1: Y_2^1 — tilted bulge (like leaning)
      float y21 = normal.y * normal.x;
      displacement += uHarmonic1 * y21 * sin(uPhase1);

      // Mode 2: Y_2^2 — equatorial squeeze (like an oval)
      float y22 = normal.x * normal.x - normal.z * normal.z;
      displacement += uHarmonic2 * y22 * cos(uPhase2);

      // Clamp total displacement to maintain spherical identity
      displacement = clamp(displacement, -uMaxDisp, uMaxDisp);
      vDisplacement = displacement;

      vec3 newPosition = position + normal * displacement;
      vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,

  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldNormal;
    varying float vDisplacement;

    uniform float uTime;
    uniform vec3 uColor1; // #FFF5F0 — lightest, center
    uniform vec3 uColor2; // #FFD6C0 — mid warmth
    uniform vec3 uColor3; // #FFC4C4 — pinkest, edges

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 eye = normalize(-vPosition);
      float facing = dot(normal, eye);

      // --- Radial gradient matching BreatheInterface ---
      // facing = 1.0 at center, 0.0 at edges
      // Start with mid-tone at center, go to pinkest at edges
      // Then overlay a highlight to create the bright upper-left spot
      float gradientT = 1.0 - facing;
      vec3 baseColor = mix(uColor2, uColor3, smoothstep(0.15, 0.8, gradientT));

      // --- Broad upper-left highlight (matching ::after pseudo-element) ---
      // BreatheInterface's ::after covers 80% of the orb with a blurred white gradient
      // at 135deg from upper-left. We use a very soft falloff (low power).
      vec3 highlightDir = normalize(vec3(-0.3, 0.4, 0.6));
      float highlight = pow(max(dot(vWorldNormal, highlightDir), 0.0), 1.2);
      baseColor = mix(baseColor, uColor1, highlight * 0.5);

      // --- Small specular accent for 3D depth ---
      vec3 lightDir = normalize(vec3(1.5, 2.5, 4.0));
      vec3 halfDir = normalize(lightDir + eye);
      float spec = pow(max(dot(normal, halfDir), 0.0), 60.0);
      baseColor += spec * vec3(1.0, 0.98, 0.96) * 0.15;

      // --- Bottom hemisphere subtle darkening ---
      float hemisphereShade = 0.95 + 0.05 * dot(vWorldNormal, vec3(0.0, 1.0, 0.0));
      baseColor *= hemisphereShade;

      // --- Subtle displacement-driven color shift ---
      baseColor = mix(baseColor, uColor3, clamp(vDisplacement * 1.5, 0.0, 0.12));

      // --- Inner shadow (BreatheInterface's inset box-shadow) ---
      float innerShadow = pow(1.0 - facing, 4.0) * 0.05;
      baseColor -= vec3(innerShadow * 0.3, innerShadow * 0.1, innerShadow * 0.05);

      // --- Fully opaque with just anti-aliasing at edge ---
      gl_FragColor = vec4(baseColor, 1.0);
    }
  `,
};
