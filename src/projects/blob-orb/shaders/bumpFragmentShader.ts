/**
 * Enhanced fragment shader with per-bump lighting.
 *
 * Uses the recalculated normal from the vertex shader (vBumpNormal)
 * for specular and diffuse lighting, so each individual bump catches
 * light independently. Adds displacement-based ambient occlusion
 * to darken crevices between bumps.
 */
export const bumpFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;          // Original smooth normal (view space)
  varying vec3 vBumpNormal;      // Recalculated bump normal (view space)
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldBumpNormal; // Recalculated bump normal (world space)
  varying float vDisplacement;

  uniform float uTime;
  uniform vec3 uColor1; // #FFF5F0 — lightest, center
  uniform vec3 uColor2; // #FFD6C0 — mid warmth
  uniform vec3 uColor3; // #FFC4C4 — pinkest, edges

  void main() {
    vec3 smoothN = normalize(vNormal);
    vec3 bumpN = normalize(vBumpNormal);
    vec3 eye = normalize(-vPosition);

    // --- Radial gradient using smooth normal (keeps overall orb shape) ---
    float facing = dot(smoothN, eye);
    float gradientT = 1.0 - facing;
    vec3 baseColor = mix(uColor2, uColor3, smoothstep(0.15, 0.8, gradientT));

    // --- Broad upper-left highlight (smooth normal for overall shape) ---
    vec3 highlightDir = normalize(vec3(-0.3, 0.4, 0.6));
    float highlight = pow(max(dot(vWorldNormal, highlightDir), 0.0), 1.2);
    baseColor = mix(baseColor, uColor1, highlight * 0.5);

    // --- Diffuse lighting per-bump (subtle — preserves base colour) ---
    vec3 lightDir = normalize(vec3(1.5, 2.5, 4.0));
    vec3 worldLight = normalize(vec3(1.5, 2.5, 4.0));
    float diffuse = max(dot(normalize(vWorldBumpNormal), worldLight), 0.0);
    float smoothDiffuse = max(dot(vWorldNormal, worldLight), 0.0);
    float combinedDiffuse = mix(smoothDiffuse, diffuse, 0.7);
    baseColor *= 0.88 + 0.12 * combinedDiffuse;

    // --- Specular per-bump (bump normal for individual highlights) ---
    vec3 halfDir = normalize(lightDir + eye);
    float spec = pow(max(dot(bumpN, halfDir), 0.0), 40.0);
    baseColor += spec * vec3(1.0, 0.98, 0.96) * 0.15;

    // --- Ambient occlusion from displacement (gentle valley darkening) ---
    float ao = smoothstep(-0.04, 0.06, vDisplacement);
    ao = 0.9 + 0.1 * ao; // Valleys get 0.9, peaks get 1.0
    baseColor *= ao;

    // --- Bottom hemisphere subtle darkening ---
    float hemisphereShade = 0.95 + 0.05 * dot(vWorldNormal, vec3(0.0, 1.0, 0.0));
    baseColor *= hemisphereShade;

    // --- Displacement-driven color shift (bumps slightly warmer) ---
    baseColor = mix(baseColor, uColor3, clamp(vDisplacement * 2.0, 0.0, 0.15));

    // --- Inner shadow at edges ---
    float innerShadow = pow(1.0 - facing, 4.0) * 0.05;
    baseColor -= vec3(innerShadow * 0.3, innerShadow * 0.1, innerShadow * 0.05);

    gl_FragColor = vec4(baseColor, 1.0);
  }
`;
