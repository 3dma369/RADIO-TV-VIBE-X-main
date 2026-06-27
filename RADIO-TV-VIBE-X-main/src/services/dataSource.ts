/**
 * dataSource.ts — VIBE-X (stub)
 * Firestore data layer for products, playlist, DJs, schedule, stream, visuals.
 * Original file deleted; stub returns empty data so app loads.
 */

export async function seedIfEmpty(): Promise<void> {
  // no-op stub
}

export function subscribeProducts(_cb: (products: any[]) => void): () => void {
  return () => {};
}

export function subscribePlaylist(_cb: (tracks: any[]) => void): () => void {
  // Trigger callback once with empty list so UI doesn't hang
  setTimeout(() => _cb([]), 0);
  return () => {};
}

export function subscribeDJs(_cb: (djs: any[]) => void): () => void {
  setTimeout(() => _cb([]), 0);
  return () => {};
}

export function subscribeSchedule(_cb: (schedule: any[]) => void): () => void {
  setTimeout(() => _cb([]), 0);
  return () => {};
}

export function subscribeStream(_cb: (stream: any) => void): () => void {
  setTimeout(() => _cb(null), 0);
  return () => {};
}

export function subscribeVisuals(_cb: (visuals: any[]) => void): () => void {
  setTimeout(() => _cb([]), 0);
  return () => {};
}

export function subscribeVisualGroups(_cb: (groups: any[]) => void): () => void {
  setTimeout(() => _cb([]), 0);
  return () => {};
}

export async function saveProduct(_product: any): Promise<void> {
  console.warn('[dataSource stub] saveProduct called');
}

export async function deleteProduct(_id: string): Promise<void> {
  console.warn('[dataSource stub] deleteProduct called');
}

export async function saveDJ(_dj: any): Promise<void> {
  console.warn('[dataSource stub] saveDJ called');
}

export async function saveSchedule(_schedule: any): Promise<void> {
  console.warn('[dataSource stub] saveSchedule called');
}

export async function saveStream(_stream: any): Promise<void> {
  console.warn('[dataSource stub] saveStream called');
}

export async function saveTrack(_track: any): Promise<void> {
  console.warn('[dataSource stub] saveTrack called');
}

export async function deleteTrack(_id: string): Promise<void> {
  console.warn('[dataSource stub] deleteTrack called');
}