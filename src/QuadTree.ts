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

const QUADRANT_KEYS = ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const;

type PointSnapshot = { x: number; y: number };
type BoundsSnapshot = { x: number; y: number; width: number; height: number };

export default class QuadTree {
  public points: Point[] = [];
  public boundedItems: BoundedItem[] = [];
  public quadrants: Quadrants = {};
  public hasQuadrants: boolean = false;

  private hasSubdivided: boolean = false;
  private pointRegistry: Map<string, PointSnapshot> = new Map();
  private boundsRegistry: Map<string, BoundsSnapshot> = new Map();

  constructor(
    public readonly area: Rectangle,
    public readonly maxDepth: number,
    public readonly maxPoints: number,
    public readonly depth: number = 0
  ) {}

  public addPoint(point: Point): boolean {
    if (!this.area.intersectsWithPoint(point)) {
      return false;
    }

    if (this.depth === 0 && point.id !== undefined) {
      this.registerPoint(point.id, point);
    }

    if (this.hasSubdivided) {
      this.routePoint(point);
      return true;
    }

    this.points.push(point);
    this.subdivideIfFull();
    return true;
  }

  public addBounds(id: string, bounds: Rectangle): boolean {
    if (!this.area.intersects(bounds)) {
      return false;
    }

    if (this.depth === 0) {
      this.registerBounds(id, bounds);
    }

    this.insertBounds({ id, bounds });
    return true;
  }

  public remove(id: string): boolean {
    const point = this.pointRegistry.get(id);
    if (point !== undefined) {
      this.pointRegistry.delete(id);
      return this.removePoint(id, point);
    }

    const bounds = this.boundsRegistry.get(id);
    if (bounds !== undefined) {
      this.boundsRegistry.delete(id);
      return this.removeBounds(id, bounds);
    }

    return false;
  }

  private removePoint(id: string, point: PointSnapshot): boolean {
    if (!this.containsCoordinates(point.x, point.y)) return false;

    if (this.hasSubdivided) {
      const cx = this.area.center.x;
      const cy = this.area.center.y;
      const key: keyof Quadrants = point.y <= cy
        ? point.x <= cx ? "topLeft" : "topRight"
        : point.x <= cx ? "bottomLeft" : "bottomRight";

      if (!this.quadrants[key]?.removePoint(id, point)) return false;
      this.pruneChild(key);
      return true;
    }

    for (let i = 0; i < this.points.length; i++) {
      if (this.points[i].id === id) {
        this.points[i] = this.points[this.points.length - 1];
        this.points.pop();
        return true;
      }
    }
    return false;
  }

  private removeBounds(id: string, bounds: BoundsSnapshot): boolean {
    if (this.hasSubdivided) {
      const key = this.childContaining(bounds.x, bounds.y, bounds.width, bounds.height);
      if (key !== undefined) {
        if (!this.quadrants[key]?.removeBounds(id, bounds)) return false;
        this.pruneChild(key);
        return true;
      }
    }

    for (let i = 0; i < this.boundedItems.length; i++) {
      if (this.boundedItems[i].id === id) {
        this.boundedItems[i] = this.boundedItems[this.boundedItems.length - 1];
        this.boundedItems.pop();
        return true;
      }
    }
    return false;
  }

  // Called as removal unwinds, so a thinned-out branch collapses from the bottom up in a
  // single pass and a churned tree keeps the same shape a freshly built one would have.
  // A node sitting exactly at `maxPoints` splits and merges on every add/remove cycle
  // (~1us vs ~0.4us if merging were deferred), which is the price for that.
  private pruneChild(key: keyof Quadrants): void {
    const child = this.quadrants[key];
    if (child !== undefined && !child.hasQuadrants && child.points.length === 0 && child.boundedItems.length === 0) {
      delete this.quadrants[key];
      this.hasQuadrants = QUADRANT_KEYS.some((k) => this.quadrants[k] !== undefined);
    }

    if (!this.hasQuadrants) {
      if (this.points.length === 0 && this.boundedItems.length === 0) {
        this.hasSubdivided = false;
      }
      return;
    }

    let total = this.boundedItems.length;
    for (const k of QUADRANT_KEYS) {
      const quadrant = this.quadrants[k];
      if (quadrant === undefined) continue;
      if (quadrant.hasQuadrants) return;
      total += quadrant.points.length + quadrant.boundedItems.length;
    }

    if (total > this.maxPoints) {
      return;
    }

    for (const k of QUADRANT_KEYS) {
      const quadrant = this.quadrants[k];
      if (quadrant === undefined) continue;
      for (const point of quadrant.points) this.points.push(point);
      for (const bounded of quadrant.boundedItems) this.boundedItems.push(bounded);
    }

    this.quadrants = {};
    this.hasQuadrants = false;
    this.hasSubdivided = false;
  }

  public updatePoint(id: string, newPoint: Point): boolean {
    if (newPoint.id !== id) {
      this.remove(id);
    }
    return this.addPoint(newPoint);
  }

  public updateBounds(id: string, newBounds: Rectangle): boolean {
    return this.addBounds(id, newBounds);
  }

  private registerPoint(id: string, point: Point): void {
    const registered = this.pointRegistry.get(id);
    if (registered !== undefined) {
      this.removePoint(id, registered);
      registered.x = point.x;
      registered.y = point.y;
      return;
    }

    const registeredBounds = this.boundsRegistry.get(id);
    if (registeredBounds !== undefined) {
      this.removeBounds(id, registeredBounds);
      this.boundsRegistry.delete(id);
    }

    this.pointRegistry.set(id, { x: point.x, y: point.y });
  }

  private registerBounds(id: string, bounds: Rectangle): void {
    const registered = this.boundsRegistry.get(id);
    if (registered !== undefined) {
      this.removeBounds(id, registered);
      registered.x = bounds.center.x;
      registered.y = bounds.center.y;
      registered.width = bounds.width;
      registered.height = bounds.height;
      return;
    }

    const registeredPoint = this.pointRegistry.get(id);
    if (registeredPoint !== undefined) {
      this.removePoint(id, registeredPoint);
      this.pointRegistry.delete(id);
    }

    this.boundsRegistry.set(id, { x: bounds.center.x, y: bounds.center.y, width: bounds.width, height: bounds.height });
  }

  public query(area: Rectangle): Point[] {
    const results: Point[] = [];
    this.queryInto(area, results, null);
    return results;
  }

  public queryBounds(area: Rectangle): BoundedItem[] {
    const results: BoundedItem[] = [];
    this.queryInto(area, null, results);
    return results;
  }

  public queryIds(area: Rectangle): string[] {
    const points: Point[] = [];
    const boundedItems: BoundedItem[] = [];
    this.queryInto(area, points, boundedItems);

    const ids: string[] = [];
    for (const p of points) {
      if (p.id !== undefined) ids.push(p.id);
    }
    for (const b of boundedItems) {
      ids.push(b.id);
    }
    return ids;
  }

  public clearPoints(): void {
    this.points = [];
    this.boundedItems = [];

    this.quadrants.topLeft?.clearPoints();
    this.quadrants.topRight?.clearPoints();
    this.quadrants.bottomLeft?.clearPoints();
    this.quadrants.bottomRight?.clearPoints();

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
    this.hasSubdivided = false;
    if (this.depth === 0) {
      this.pointRegistry.clear();
      this.boundsRegistry.clear();
    }
  }

  private containsCoordinates(x: number, y: number): boolean {
    return x >= this.area.topLeftX && x <= this.area.topRightX && y >= this.area.topLeftY && y <= this.area.bottomLeftY;
  }

  private childContaining(x: number, y: number, width: number, height: number): keyof Quadrants | undefined {
    const left = x - width / 2;
    const right = x + width / 2;
    const top = y - height / 2;
    const bottom = y + height / 2;

    if (left < this.area.topLeftX || right > this.area.topRightX || top < this.area.topLeftY || bottom > this.area.bottomLeftY) {
      return undefined;
    }

    const cx = this.area.center.x;
    const cy = this.area.center.y;

    if (bottom <= cy) {
      return right <= cx ? "topLeft" : left >= cx ? "topRight" : undefined;
    }
    if (top >= cy) {
      return right <= cx ? "bottomLeft" : left >= cx ? "bottomRight" : undefined;
    }
    return undefined;
  }

  private queryInto(area: Rectangle, results: Point[] | null, boundedResults: BoundedItem[] | null): void {
    if (!this.area.intersects(area)) {
      return;
    }

    if (boundedResults !== null) {
      for (const bounded of this.boundedItems) {
        if (area.intersects(bounded.bounds)) {
          boundedResults.push(bounded);
        }
      }
    }

    if (this.hasQuadrants) {
      this.quadrants.topLeft?.queryInto(area, results, boundedResults);
      this.quadrants.topRight?.queryInto(area, results, boundedResults);
      this.quadrants.bottomLeft?.queryInto(area, results, boundedResults);
      this.quadrants.bottomRight?.queryInto(area, results, boundedResults);
      return;
    }

    if (results !== null) {
      for (const point of this.points) {
        if (area.intersectsWithPoint(point)) {
          results.push(point);
        }
      }
    }
  }

  private insertBounds(item: BoundedItem): void {
    if (this.hasSubdivided) {
      const key = this.childContaining(item.bounds.center.x, item.bounds.center.y, item.bounds.width, item.bounds.height);
      if (key !== undefined) {
        this.childAt(key).insertBounds(item);
        return;
      }
      this.boundedItems.push(item);
      return;
    }

    this.boundedItems.push(item);
    this.subdivideIfFull();
  }

  private subdivideIfFull(): void {
    if (this.points.length + this.boundedItems.length <= this.maxPoints || this.depth >= this.maxDepth) {
      return;
    }

    this.hasSubdivided = true;

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
      this.insertBounds(bounded);
    }
  }

  private routePoint(point: Point): void {
    const cx = this.area.center.x;
    const cy = this.area.center.y;
    const key: keyof Quadrants =
      point.y <= cy
        ? point.x <= cx ? "topLeft" : "topRight"
        : point.x <= cx ? "bottomLeft" : "bottomRight";

    this.childAt(key).addPoint(point);
  }

  private childAt(key: keyof Quadrants): QuadTree {
    let child = this.quadrants[key];
    if (!child) {
      child = this.createChild(key);
      this.quadrants[key] = child;
      this.hasQuadrants = true;
    }
    return child;
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

    const child = new QuadTree(new Rectangle(halfW, halfH, new Point(childCx, childCy)), this.maxDepth, this.maxPoints, this.depth + 1);
    child.pointRegistry = this.pointRegistry;
    child.boundsRegistry = this.boundsRegistry;
    return child;
  }
}
