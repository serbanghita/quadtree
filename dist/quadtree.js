"use strict";
(() => {
  // ../geometry/dist/Point.js
  var Point = class {
    constructor(x, y, id) {
      this.x = x;
      this.y = y;
      this.id = id;
      this.x = x;
      this.y = y;
      this.id = id;
    }
    intersects(point) {
      return this.x === point.x && this.y === point.y;
    }
    intersectsWithRectangle(rectangle) {
      return this.x >= rectangle.topLeftX && this.x <= rectangle.topRightX && this.y >= rectangle.topLeftY && this.y <= rectangle.bottomLeftY;
    }
  };

  // ../geometry/dist/Rectangle.js
  var Rectangle = class {
    constructor(width, height, center) {
      this.width = width;
      this.height = height;
      this.center = center;
      this.area = width * height;
    }
    init(width, height, centerX, centerY) {
      this.width = width;
      this.height = height;
      this.center.x = centerX;
      this.center.y = centerY;
      this.area = width * height;
    }
    resize(width, height) {
      this.width = width;
      this.height = height;
      this.area = width * height;
    }
    moveCenterTo(x, y) {
      this.center.x = x;
      this.center.y = y;
    }
    moveCenterBy(deltaX, deltaY) {
      this.center.x += deltaX;
      this.center.y += deltaY;
    }
    get topLeftX() {
      return this.center.x - this.width / 2;
    }
    get topLeftY() {
      return this.center.y - this.height / 2;
    }
    get topRightX() {
      return this.center.x + this.width / 2;
    }
    get topRightY() {
      return this.center.y - this.height / 2;
    }
    get bottomLeftX() {
      return this.center.x - this.width / 2;
    }
    get bottomLeftY() {
      return this.center.y + this.height / 2;
    }
    get bottomRightX() {
      return this.center.x + this.width / 2;
    }
    get bottomRightY() {
      return this.center.y + this.height / 2;
    }
    intersects(rectangle) {
      return !(this.topRightX < rectangle.topLeftX || this.bottomLeftY < rectangle.topLeftY || this.topLeftX > rectangle.topRightX || this.topLeftY > rectangle.bottomLeftY);
    }
    intersectsWithPoint(point, tolerance = 0) {
      return point.x >= this.topLeftX - tolerance && point.x <= this.topRightX + tolerance && point.y >= this.topLeftY - tolerance && point.y <= this.bottomLeftY + tolerance;
    }
  };

  // src/QuadTree.ts
  var QuadTree = class _QuadTree {
    constructor(area, maxDepth, maxPoints, depth = 0) {
      this.area = area;
      this.maxDepth = maxDepth;
      this.maxPoints = maxPoints;
      this.depth = depth;
      this.points = [];
      this.quadrants = {};
      this.hasQuadrants = false;
    }
    addPoint(point) {
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
    query(area) {
      const results = [];
      this.queryInto(area, results);
      return results;
    }
    clearPoints() {
      this.points = [];
    }
    clear() {
      this.points = [];
      this.quadrants = {};
      this.hasQuadrants = false;
    }
    queryInto(area, results) {
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
    subdivide() {
      const pointsToRoute = this.points;
      this.points = [];
      for (const point of pointsToRoute) {
        if (this.area.intersectsWithPoint(point)) {
          this.routePoint(point);
        }
      }
    }
    // Boundary points (x === center.x or y === center.y) go to the top/left side.
    routePoint(point) {
      const cx = this.area.center.x;
      const cy = this.area.center.y;
      const key = point.y <= cy ? point.x <= cx ? "topLeft" : "topRight" : point.x <= cx ? "bottomLeft" : "bottomRight";
      let child = this.quadrants[key];
      if (!child) {
        child = this.createChild(key);
        this.quadrants[key] = child;
        this.hasQuadrants = true;
      }
      child.addPoint(point);
    }
    createChild(key) {
      const halfW = this.area.width / 2;
      const halfH = this.area.height / 2;
      const quarterW = halfW / 2;
      const quarterH = halfH / 2;
      const cx = this.area.center.x;
      const cy = this.area.center.y;
      let childCx;
      let childCy;
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
      return new _QuadTree(
        new Rectangle(halfW, halfH, new Point(childCx, childCy)),
        this.maxDepth,
        this.maxPoints,
        this.depth + 1
      );
    }
  };
})();
