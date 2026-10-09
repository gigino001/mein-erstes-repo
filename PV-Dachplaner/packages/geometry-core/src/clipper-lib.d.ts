declare module "clipper-lib" {
  export interface IntPoint {
    X: number;
    Y: number;
  }
  export type Path = IntPoint[];
  export type Paths = Path[];
  export class Clipper {
    constructor();
    AddPaths(paths: Paths, polyType: number, closed: boolean): boolean;
    Execute(clipType: number, solution: Paths, subjFillType: number, clipFillType: number): boolean;
    static Area(path: Path): number;
    static get PolyType(): never;
  }
  export class ClipperOffset {
    constructor(miterLimit?: number, arcTolerance?: number);
    AddPaths(paths: Paths, joinType: number, endType: number): void;
    Execute(solution: Paths, delta: number): void;
  }
  const ClipperLib: {
    Clipper: typeof Clipper;
    ClipperOffset: typeof ClipperOffset;
    PolyType: { ptSubject: number; ptClip: number };
    ClipType: { ctIntersection: number; ctUnion: number; ctDifference: number; ctXor: number };
    PolyFillType: { pftEvenOdd: number; pftNonZero: number; pftPositive: number; pftNegative: number };
    JoinType: { jtSquare: number; jtRound: number; jtMiter: number };
    EndType: { etOpenSquare: number; etOpenRound: number; etOpenButt: number; etClosedLine: number; etClosedPolygon: number };
  };
  export default ClipperLib;
}
