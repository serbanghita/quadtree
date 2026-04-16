import { Rectangle, Point } from "@serbanghita-gamedev/geometry";

export type Quadrants = {
  topLeft?: QuadTree;
  topRight?: QuadTree;
  bottomLeft?: QuadTree;
  bottomRight?: QuadTree;
};

export default class QuadTree {
  public points: Point[] = [];
  public quadrants: Quadrants = {};
  public hasQuadrants: boolean = false;

  constructor(
    public readonly area: Rectangle,
    public readonly maxDepth: number,
    public readonly maxPoints: number,
    public readonly depth: number = 0,
  ) {}

  public addPoint(point: Point): boolean {
    if (!this.area.intersectsWithPoint(point)) {
      return false;
    }

    if (this.hasQuadrants) {
      this.routePoint(point);
      return true;
    }

    this.points.push(point);
    if (this.points.length > this.maxPoints && this.depth < this.maxDepth) {
      this.subdivide();
    }
    return true;
  }

  public query(area: Rectangle): Point[] {
    const results: Point[] = [];
    this.queryInto(area, results);
    return results;
  }

  public clearPoints(): void {
    this.points = [];
  }

  public clear(): void {
    this.points = [];
    this.quadrants = {};
    this.hasQuadrants = false;
  }

  private queryInto(area: Rectangle, results: Point[]): void {
    if (!this.area.intersects(area)) {
      return;
    }

    if (this.hasQuadrants) {
      this.quadrants.topLeft?.queryInto(area, results);
      this.quadrants.topRight?.queryInto(area, results);
      this.quadrants.bottomLeft?.queryInto(area, results);
      this.quadrants.bottomRight?.queryInto(area, results);
      return;
    }

    for (const point of this.points) {
      if (area.intersectsWithPoint(point)) {
        results.push(point);
      }
    }
  }

  private subdivide(): void {
    const pointsToRoute = this.points;
    this.points = [];
    for (const point of pointsToRoute) {
      if (this.area.intersectsWithPoint(point)) {
        this.routePoint(point);
      }
    }
  }

  // Boundary points (x === center.x or y === center.y) go to the top/left side.
  private routePoint(point: Point): void {
    const cx = this.area.center.x;
    const cy = this.area.center.y;
    const key: keyof Quadrants =
      point.y <= cy
        ? point.x <= cx ? "topLeft" : "topRight"
        : point.x <= cx ? "bottomLeft" : "bottomRight";

    let child = this.quadrants[key];
    if (!child) {
      child = this.createChild(key);
      this.quadrants[key] = child;
      this.hasQuadrants = true;
    }
    child.addPoint(point);
  }

  private createChild(key: keyof Quadrants): QuadTree {
    const halfW = this.area.width / 2;
    const halfH = this.area.height / 2;
    const quarterW = halfW / 2;
    const quarterH = halfH / 2;
    const cx = this.area.center.x;
    const cy = this.area.center.y;

    let childCx: number;
    let childCy: number;
    switch (key) {
      case "topLeft":
        childCx = cx - quarterW;
        childCy = cy - quarterH;
        break;
      case "topRight":
        childCx = cx + quarterW;
        childCy = cy - quarterH;
        break;
      case "bottomLeft":
        childCx = cx - quarterW;
        childCy = cy + quarterH;
        break;
      case "bottomRight":
        childCx = cx + quarterW;
        childCy = cy + quarterH;
        break;
    }

    return new QuadTree(
      new Rectangle(halfW, halfH, new Point(childCx, childCy)),
      this.maxDepth,
      this.maxPoints,
      this.depth + 1,
    );
  }
}
