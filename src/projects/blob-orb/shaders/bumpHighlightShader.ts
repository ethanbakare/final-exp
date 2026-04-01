/**
 * Option A: Highlight-only bump shader.
 *
 * Never darkens below base palette colour. Bump detail is revealed
 * by brightening peaks toward white — bumps facing the light get a
 * subtle lift. No multiplicative darkening at all, so peach stays peach.
 */
export const bumpHighlightShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vBumpNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldBumpNormal;
  varying float vDisplacement;

  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;

  void main() {
    vec3 smoothN = normalize(vNormal);
    vec3 bumpN = normalize(vBumpNormal);
    vec3 eye = normalize(-vPosition);
    float facing = dot(smoothN, eye);

    // --- Base colour from palette (identical to original shader) ---
    float gradientT = 1.0 - facing;
    vec3 baseColor = mix(uColor2, uColor3, smoothstep(0.15, 0.8, gradientT));

    // Broad upper-left highlight
    vec3 highlightDir = normalize(vec3(-0.3, 0.4, 0.6));
    float highlight = pow(max(dot(vWorldNormal, highlightDir), 0.0), 1.2);
    baseColor = mix(baseColor, uColor1, highlight * 0.5);

    // --- Per-bump highlight (additive only, never darkens) ---
    vec3 worldLight = normalize(vec3(1.5, 2.5, 4.0));
    float bumpDiffuse = max(dot(normalize(vWorldBumpNormal), worldLight), 0.0);
    float smoothDiffuse = max(dot(vWorldNormal, worldLight), 0.0);

    // How much brighter is this bump vs the smooth sphere?
    // Positive = bump faces light more than smooth surface would
    float bumpLift = max(bumpDiffuse - smoothDiffuse, 0.0);
    baseColor += bumpLift * vec3(1.0, 0.97, 0.94) * 0.35;

    // --- Per-bump specular (additive white) ---
    vec3 lightDir = normalize(vec3(1.5, 2.5, 4.0));
    vec3 halfDir = normalize(lightDir + eye);
    float spec = pow(max(dot(bumpN, halfDir), 0.0), 50.0);
    baseColor += spec * vec3(1.0, 0.98, 0.96) * 0.2;

    // --- Fresnel on bump normals (edge glow on individual bumps) ---
    float bumpFacing = dot(bumpN, eye);
    float bumpFresnel = pow(1.0 - max(bumpFacing, 0.0), 3.0);
    float smoothFresnel = pow(1.0 - max(facing, 0.0), 3.0);
    float fresnelDiff = max(bumpFresnel - smoothFresnel, 0.0);
    baseColor += fresnelDiff * uColor3 * 0.15;

    // --- Bottom hemisphere subtle darkening (original shader level) ---
    float hemisphereShade = 0.95 + 0.05 * dot(vWorldNormal, vec3(0.0, 1.0, 0.0));
    baseColor *= hemisphereShade;

    // --- Displacement colour shift (same as original) ---
    baseColor = mix(baseColor, uColor3, clamp(vDisplacement * 1.5, 0.0, 0.12));

    // --- Inner shadow (same as original) ---
    float innerShadow = pow(1.0 - facing, 4.0) * 0.05;
    baseColor -= vec3(innerShadow * 0.3, innerShadow * 0.1, innerShadow * 0.05);

    gl_FragColor = vec4(baseColor, 1.0);
  }
`;
