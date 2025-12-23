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
    createQuadrants() {
      const topLeft = new _QuadTree(
        new Rectangle(this.area.width / 2, this.area.height / 2, new Point(this.area.center.x - this.area.width / 4, this.area.center.y - this.area.height / 4)),
        this.maxDepth,
        this.maxPoints,
        this.depth + 1
      );
      const topRight = new _QuadTree(
        new Rectangle(this.area.width / 2, this.area.height / 2, new Point(this.area.center.x + this.area.width / 4, this.area.center.y - this.area.height / 4)),
        this.maxDepth,
        this.maxPoints,
        this.depth + 1
      );
      const bottomLeft = new _QuadTree(
        new Rectangle(this.area.width / 2, this.area.height / 2, new Point(this.area.center.x - this.area.width / 4, this.area.center.y + this.area.height / 4)),
        this.maxDepth,
        this.maxPoints,
        this.depth + 1
      );
      const bottomRight = new _QuadTree(
        new Rectangle(this.area.width / 2, this.area.height / 2, new Point(this.area.center.x + this.area.width / 4, this.area.center.y + this.area.height / 4)),
        this.maxDepth,
        this.maxPoints,
        this.depth + 1
      );
      return { topLeft, topRight, bottomLeft, bottomRight };
    }
    candidatePoint(point) {
      return this.area.intersectsWithPoint(point);
    }
    addPoint(point) {
      if (!this.candidatePoint(point)) {
        return false;
      }
      this.points.push(point);
      if (this.hasQuadrants || this.points.length > this.maxPoints && this.depth < this.maxDepth) {
        this.redistributePoints();
        this.clearPoints();
      }
      return true;
    }
    redistributePoints() {
      const quadrants = this.createQuadrants();
      this.points.forEach((point) => {
        for (const [key, quadrant] of Object.entries(quadrants)) {
          const searchInQuadrant = this.quadrants[key] ?? quadrant;
          if (searchInQuadrant.candidatePoint(point)) {
            if (!this.quadrants[key]) {
              this.quadrants[key] = quadrant;
            }
            this.quadrants[key]?.addPoint(point);
            break;
          }
        }
      });
      if (Object.keys(this.quadrants).length > 0) {
        this.hasQuadrants = true;
      }
    }
    clearPoints() {
      this.points = [];
    }
    query(area) {
      if (!this.area.intersects(area)) {
        return [];
      }
      if (this.points.length === 0) {
        return Object.values(this.quadrants).reduce((acc, quadrant) => {
          return acc.concat(quadrant.query(area));
        }, []);
      }
      return this.points.filter((point) => area.intersectsWithPoint(point));
    }
    clearQuadrants() {
      this.hasQuadrants = false;
      this.quadrants = {};
    }
    clear() {
      this.clearPoints();
      this.clearQuadrants();
    }
  };
})();
