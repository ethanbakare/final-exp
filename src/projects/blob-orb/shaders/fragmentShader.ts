/**
 * Shared fragment shader matching BreatheInterface's radial gradient.
 * All orb variants use this same fragment — only vertex shaders differ.
 */
export const fragmentShader = `
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
    float gradientT = 1.0 - facing;
    vec3 baseColor = mix(uColor2, uColor3, smoothstep(0.15, 0.8, gradientT));

    // --- Broad upper-left highlight ---
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

    // --- Inner shadow ---
    float innerShadow = pow(1.0 - facing, 4.0) * 0.05;
    baseColor -= vec3(innerShadow * 0.3, innerShadow * 0.1, innerShadow * 0.05);

    gl_FragColor = vec4(baseColor, 1.0);
  }
`;
