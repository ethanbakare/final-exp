/**
 * Maps frequency data to bar values around a circle with N-point symmetry.
 *
 * Divides the ring into `segments` equal parts. Within each segment, frequency
 * bins are mapped from low→high and then mirrored back, so each segment
 * boundary becomes a flare point (highest energy = bass) and each midpoint
 * tapers off.
 */
export function mapFrequencyToBars(
  frequencyData: Uint8Array | null,
  barCount: number,
  sensitivity: number,
  segments: number = 8,
): number[] {
  const values: number[] = new Array(barCount).fill(0);
  if (!frequencyData || frequencyData.length === 0) return values;

  // Use frequency bins 5%–40% (voice + mid range)
  const startBin = Math.floor(frequencyData.length * 0.05);
  const endBin = Math.floor(frequencyData.length * 0.4);
  const relevant = frequencyData.slice(startBin, endBin);
  const binCount = relevant.length;

  const barsPerSegment = barCount / segments;

  for (let i = 0; i < barCount; i++) {
    // Position within the current segment (0 to 1)
    const segPos = (i % barsPerSegment) / barsPerSegment;
    // Triangle wave: 0 at segment boundary, 1 at midpoint, 0 at next boundary
    const mirror = segPos < 0.5 ? segPos * 2 : (1 - segPos) * 2;
    // Map mirror position to frequency bin index
    const binIndex = Math.floor(mirror * (binCount - 1));
    const raw = relevant[binIndex] / 255;
    values[i] = Math.min(1, raw * sensitivity);
  }

  return values;
}
