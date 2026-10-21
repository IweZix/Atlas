export function formatCoords(lat: number, lon: number): string {
  const ns = lat < 0 ? 'S' : 'N';
  const eo = lon < 0 ? 'O' : 'E';
  return `${Math.abs(lat).toFixed(2)}°${ns}  ${Math.abs(lon).toFixed(2)}°${eo}`;
}
