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
  var QUADRANT_KEYS = ["topLeft", "topRight", "bottomLeft", "bottomRight"];
  var QuadTree = class _QuadTree {
    constructor(area, maxDepth, maxPoints, depth = 0) {
      this.area = area;
      this.maxDepth = maxDepth;
      this.maxPoints = maxPoints;
      this.depth = depth;
      this.points = [];
      this.boundedItems = [];
      this.quadrants = {};
      this.hasQuadrants = false;
      this.hasSubdivided = false;
      this.pointRegistry = /* @__PURE__ */ new Map();
      this.boundsRegistry = /* @__PURE__ */ new Map();
    }
    addPoint(point) {
      if (!this.area.intersectsWithPoint(point)) {
        return false;
      }
      if (this.depth === 0 && point.id !== void 0) {
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
    addBounds(id, bounds) {
      if (!this.area.intersects(bounds)) {
        return false;
      }
      if (this.depth === 0) {
        this.registerBounds(id, bounds);
      }
      this.insertBounds({ id, bounds });
      return true;
    }
    remove(id) {
      const point = this.pointRegistry.get(id);
      if (point !== void 0) {
        this.pointRegistry.delete(id);
        return this.removePoint(id, point);
      }
      const bounds = this.boundsRegistry.get(id);
      if (bounds !== void 0) {
        this.boundsRegistry.delete(id);
        return this.removeBounds(id, bounds);
      }
      return false;
    }
    removePoint(id, point) {
      if (!this.containsCoordinates(point.x, point.y)) return false;
      if (this.hasSubdivided) {
        const cx = this.area.center.x;
        const cy = this.area.center.y;
        const key = point.y <= cy ? point.x <= cx ? "topLeft" : "topRight" : point.x <= cx ? "bottomLeft" : "bottomRight";
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
    removeBounds(id, bounds) {
      if (this.hasSubdivided) {
        const key = this.childContaining(bounds.x, bounds.y, bounds.width, bounds.height);
        if (key !== void 0) {
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
    pruneChild(key) {
      const child = this.quadrants[key];
      if (child !== void 0 && !child.hasQuadrants && child.points.length === 0 && child.boundedItems.length === 0) {
        delete this.quadrants[key];
        this.hasQuadrants = QUADRANT_KEYS.some((k) => this.quadrants[k] !== void 0);
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
        if (quadrant === void 0) continue;
        if (quadrant.hasQuadrants) return;
        total += quadrant.points.length + quadrant.boundedItems.length;
      }
      if (total > this.maxPoints) {
        return;
      }
      for (const k of QUADRANT_KEYS) {
        const quadrant = this.quadrants[k];
        if (quadrant === void 0) continue;
        for (const point of quadrant.points) this.points.push(point);
        for (const bounded of quadrant.boundedItems) this.boundedItems.push(bounded);
      }
      this.quadrants = {};
      this.hasQuadrants = false;
      this.hasSubdivided = false;
    }
    updatePoint(id, newPoint) {
      if (newPoint.id !== id) {
        this.remove(id);
      }
      return this.addPoint(newPoint);
    }
    updateBounds(id, newBounds) {
      return this.addBounds(id, newBounds);
    }
    registerPoint(id, point) {
      const registered = this.pointRegistry.get(id);
      if (registered !== void 0) {
        this.removePoint(id, registered);
        registered.x = point.x;
        registered.y = point.y;
        return;
      }
      const registeredBounds = this.boundsRegistry.get(id);
      if (registeredBounds !== void 0) {
        this.removeBounds(id, registeredBounds);
        this.boundsRegistry.delete(id);
      }
      this.pointRegistry.set(id, { x: point.x, y: point.y });
    }
    registerBounds(id, bounds) {
      const registered = this.boundsRegistry.get(id);
      if (registered !== void 0) {
        this.removeBounds(id, registered);
        registered.x = bounds.center.x;
        registered.y = bounds.center.y;
        registered.width = bounds.width;
        registered.height = bounds.height;
        return;
      }
      const registeredPoint = this.pointRegistry.get(id);
      if (registeredPoint !== void 0) {
        this.removePoint(id, registeredPoint);
        this.pointRegistry.delete(id);
      }
      this.boundsRegistry.set(id, { x: bounds.center.x, y: bounds.center.y, width: bounds.width, height: bounds.height });
    }
    query(area) {
      const results = [];
      this.queryInto(area, results, null);
      return results;
    }
    queryBounds(area) {
      const results = [];
      this.queryInto(area, null, results);
      return results;
    }
    queryIds(area) {
      const points = [];
      const boundedItems = [];
      this.queryInto(area, points, boundedItems);
      const ids = [];
      for (const p of points) {
        if (p.id !== void 0) ids.push(p.id);
      }
      for (const b of boundedItems) {
        ids.push(b.id);
      }
      return ids;
    }
    clearPoints() {
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
    clear() {
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
    containsCoordinates(x, y) {
      return x >= this.area.topLeftX && x <= this.area.topRightX && y >= this.area.topLeftY && y <= this.area.bottomLeftY;
    }
    childContaining(x, y, width, height) {
      const left = x - width / 2;
      const right = x + width / 2;
      const top = y - height / 2;
      const bottom = y + height / 2;
      if (left < this.area.topLeftX || right > this.area.topRightX || top < this.area.topLeftY || bottom > this.area.bottomLeftY) {
        return void 0;
      }
      const cx = this.area.center.x;
      const cy = this.area.center.y;
      if (bottom <= cy) {
        return right <= cx ? "topLeft" : left >= cx ? "topRight" : void 0;
      }
      if (top >= cy) {
        return right <= cx ? "bottomLeft" : left >= cx ? "bottomRight" : void 0;
      }
      return void 0;
    }
    queryInto(area, results, boundedResults) {
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
    insertBounds(item) {
      if (this.hasSubdivided) {
        const key = this.childContaining(item.bounds.center.x, item.bounds.center.y, item.bounds.width, item.bounds.height);
        if (key !== void 0) {
          this.childAt(key).insertBounds(item);
          return;
        }
        this.boundedItems.push(item);
        return;
      }
      this.boundedItems.push(item);
      this.subdivideIfFull();
    }
    subdivideIfFull() {
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
    routePoint(point) {
      const cx = this.area.center.x;
      const cy = this.area.center.y;
      const key = point.y <= cy ? point.x <= cx ? "topLeft" : "topRight" : point.x <= cx ? "bottomLeft" : "bottomRight";
      this.childAt(key).addPoint(point);
    }
    childAt(key) {
      let child = this.quadrants[key];
      if (!child) {
        child = this.createChild(key);
        this.quadrants[key] = child;
        this.hasQuadrants = true;
      }
      return child;
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
      const child = new _QuadTree(new Rectangle(halfW, halfH, new Point(childCx, childCy)), this.maxDepth, this.maxPoints, this.depth + 1);
      child.pointRegistry = this.pointRegistry;
      child.boundsRegistry = this.boundsRegistry;
      return child;
    }
  };
})();
