# Blob Orb Variants

Start here. For the full journey of how we got to these files, see
[VARIANTS.md](../VARIANTS.md) in the parent directory.

## Active Files

These are the files that matter. Everything else is in `archived/`.

| File | What It Is |
|------|-----------|
| **CoralStone.tsx** | Bumpy sphere, 24 sine waves, hue-shift shader. The signature look. |
| **CoralStoneMorph.tsx** | Sphere-to-torus morph with torus radius control. Used in Studio. |
| **CoralStoneTorusDamped.tsx** | Bumpy torus with inner-face dampening + thicken toggle. Used in Studio. |
| **GentleOrb.tsx** | Smooth sphere, 8 waves, 50% audio reaction. The subtle one. |
| **GentleOrbThicken.tsx** | Smooth torus with thick/thin toggle. Used in Studio. |
| **GentleOrbTorus.tsx** | Smooth torus, full displacement. |
| **GentleOrbTorusDamped.tsx** | Smooth torus with inner-face dampening. |

## Material Experiments

Fragment shader variations on CoralStone's 24-wave vertex shader.
Compare at `/blob-orb/materials`.

| File | What It Is |
|------|-----------|
| **CoralStoneMetal.tsx** | Liquid metal: tight specular, metallic tint, fake matcap env. |
| **CoralStonePlastic.tsx** | Glossy plastic: strong diffuse, hard white spec, candy pink. |
| **CoralStoneIce.tsx** | Ice: blue palette, sharp specular, strong edge fresnel. |

## Archived (`archived/`)

Superseded variants kept for reference. Each was a stepping stone to the
active files above. They still work and are imported by the older comparison
pages (`/blob-orb/compare`, `/blob-orb/sine-waves`, `/blob-orb/doughnuts`,
`/blob-orb/morph`).

Do not delete them — those showcase pages depend on them.
