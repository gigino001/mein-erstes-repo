import type { Point, Ring } from "../src/types";

export function rect(x: number, y: number, w: number, h: number): Ring {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
}

export function rotate(ring: Ring, deg: number): Ring {
  const t = (deg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return ring.map((p: Point) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c }));
}

export function polyArea(ring: Ring): number {
  let s = 0;
  ring.forEach((p, i) => {
    const q = ring[(i + 1) % ring.length]!;
    s += p.x * q.y - q.x * p.y;
  });
  return Math.abs(s) / 2;
}
