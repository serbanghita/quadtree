import { Rectangle, Point } from "@serbanghita-gamedev/geometry";

export type Quadrants = {
  topLeft?: QuadTree;
  topRight?: QuadTree;
  bottomLeft?: QuadTree;
  bottomRight?: QuadTree;
};

export interface BoundedItem {
  id: string;
  bounds: Rectangle;
}

export default class QuadTree {
  public points: Point[] = [];
  public boundedItems: BoundedItem[] = [];
  public quadrants: Quadrants = {};
  public hasQuadrants: boolean = false;

  constructor(
    public readonly area: Rectangle,
    public readonly maxDepth: number,
    public readonly maxPoints: number,
    public readonly depth: number = 0,
    private pointRegistry: Map<string, Point> = new Map(),
    private boundsRegistry: Map<string, Rectangle> = new Map()
  ) {}

  public addPoint(point: Point): boolean {
    if (!this.area.intersectsWithPoint(point)) {
      return false;
    }

    if (this.depth === 0 && point.id !== undefined) {
      this.pointRegistry.set(point.id, point);
    }

    if (this.hasQuadrants) {
      this.routePoint(point);
      return true;
    }

    this.points.push(point);
    if (this.points.length + this.boundedItems.length > this.maxPoints && this.depth < this.maxDepth) {
      this.subdivide();
    }
    return true;
  }

  public addBounds(id: string, bounds: Rectangle): boolean {
    if (!this.area.intersects(bounds)) {
      return false;
    }

    if (this.depth === 0) {
      this.boundsRegistry.set(id, bounds);
    }

    if (this.hasQuadrants) {
      this.routeBounds({ id, bounds });
      return true;
    }

    this.boundedItems.push({ id, bounds });
    if (this.points.length + this.boundedItems.length > this.maxPoints && this.depth < this.maxDepth) {
      this.subdivide();
    }
    return true;
  }

  public remove(id: string): boolean {
    if (this.pointRegistry.has(id)) {
      const point = this.pointRegistry.get(id)!;
      if (this.depth === 0) this.pointRegistry.delete(id);
      return this.removePoint(id, point);
    } else if (this.boundsRegistry.has(id)) {
      const bounds = this.boundsRegistry.get(id)!;
      if (this.depth === 0) this.boundsRegistry.delete(id);
      return this.removeBounds(id, bounds);
    }
    return false;
  }

  private removePoint(id: string, point: Point): boolean {
    if (!this.area.intersectsWithPoint(point)) return false;

    if (this.hasQuadrants) {
      const cx = this.area.center.x;
      const cy = this.area.center.y;
      const key: keyof Quadrants = point.y <= cy
        ? point.x <= cx ? "topLeft" : "topRight"
        : point.x <= cx ? "bottomLeft" : "bottomRight";
      
      return this.quadrants[key]?.removePoint(id, point) || false;
    }

    const initialLength = this.points.length;
    this.points = this.points.filter(p => p.id !== id);
    return this.points.length < initialLength;
  }

  private removeBounds(id: string, bounds: Rectangle): boolean {
    if (!this.area.intersects(bounds)) return false;

    if (this.hasQuadrants) {
      let removed = false;
      for (const key of ["topLeft", "topRight", "bottomLeft", "bottomRight"] as (keyof Quadrants)[]) {
        if (this.quadrants[key]?.removeBounds(id, bounds)) {
          removed = true;
        }
      }
      return removed;
    }

    const initialLength = this.boundedItems.length;
    this.boundedItems = this.boundedItems.filter(b => b.id !== id);
    return this.boundedItems.length < initialLength;
  }

  public updatePoint(id: string, newPoint: Point): boolean {
    this.remove(id);
    return this.addPoint(newPoint);
  }

  public updateBounds(id: string, newBounds: Rectangle): boolean {
    this.remove(id);
    return this.addBounds(id, newBounds);
  }

  public query(area: Rectangle): Point[] {
    const results: Point[] = [];
    this.queryInto(area, results, []);
    return results;
  }

  public queryIds(area: Rectangle): string[] {
    const points: Point[] = [];
    const boundedItems: BoundedItem[] = [];
    this.queryInto(area, points, boundedItems);

    const ids = new Set<string>();
    for (const p of points) {
      if (p.id !== undefined) ids.add(p.id);
    }
    for (const b of boundedItems) {
      ids.add(b.id);
    }
    return Array.from(ids);
  }

  public clearPoints(): void {
    this.points = [];
    this.boundedItems = [];
    if (this.depth === 0) {
      this.pointRegistry.clear();
      this.boundsRegistry.clear();
    }
  }

  public clear(): void {
    this.points = [];
    this.boundedItems = [];
    this.quadrants = {};
    this.hasQuadrants = false;
    if (this.depth === 0) {
      this.pointRegistry.clear();
      this.boundsRegistry.clear();
    }
  }

  private queryInto(area: Rectangle, results: Point[], boundedResults: BoundedItem[]): void {
    if (!this.area.intersects(area)) {
      return;
    }

    if (this.hasQuadrants) {
      this.quadrants.topLeft?.queryInto(area, results, boundedResults);
      this.quadrants.topRight?.queryInto(area, results, boundedResults);
      this.quadrants.bottomLeft?.queryInto(area, results, boundedResults);
      this.quadrants.bottomRight?.queryInto(area, results, boundedResults);
      return;
    }

    for (const point of this.points) {
      if (area.intersectsWithPoint(point)) {
        results.push(point);
      }
    }
    
    for (const bounded of this.boundedItems) {
      if (area.intersects(bounded.bounds)) {
        boundedResults.push(bounded);
      }
    }
  }

  private subdivide(): void {
    const pointsToRoute = this.points;
    const boundsToRoute = this.boundedItems;
    this.points = [];
    this.boundedItems = [];

    for (const point of pointsToRoute) {
      if (this.area.intersectsWithPoint(point)) {
        this.routePoint(point);
      }
    }
    
    for (const bounded of boundsToRoute) {
      if (this.area.intersects(bounded.bounds)) {
        this.routeBounds(bounded);
      }
    }
  }

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
  
  private routeBounds(item: BoundedItem): void {
    const cx = this.area.center.x;
    const cy = this.area.center.y;
    const halfW = this.area.width / 2;
    const halfH = this.area.height / 2;
    const quarterW = halfW / 2;
    const quarterH = halfH / 2;

    const areas: Record<keyof Quadrants, Rectangle> = {
      topLeft: new Rectangle(halfW, halfH, new Point(cx - quarterW, cy - quarterH)),
      topRight: new Rectangle(halfW, halfH, new Point(cx + quarterW, cy - quarterH)),
      bottomLeft: new Rectangle(halfW, halfH, new Point(cx - quarterW, cy + quarterH)),
      bottomRight: new Rectangle(halfW, halfH, new Point(cx + quarterW, cy + quarterH)),
    };

    for (const key of ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const) {
      if (areas[key].intersects(item.bounds)) {
        let child = this.quadrants[key];
        if (!child) {
          child = this.createChild(key);
          this.quadrants[key] = child;
          this.hasQuadrants = true;
        }
        child.addBounds(item.id, item.bounds);
      }
    }
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
      this.pointRegistry,
      this.boundsRegistry
    );
  }
}
