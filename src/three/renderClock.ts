/** Preserve the deadline remainder without rendering early (which duplicates frames). */
export function stepRenderClock(now: number, last: number, interval: number) {
  const elapsed = now - last;
  return elapsed >= interval ? now - elapsed % interval : undefined;
}
