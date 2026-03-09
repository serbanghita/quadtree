# QuadTree ECS Integration Improvements

## Proposed API Enhancements

### 1. Add `queryIds()` Method
Returns entity IDs directly instead of Point objects.

```typescript
public queryIds(area: Rectangle): string[] {
  const points = this.query(area);
  return points
    .map(p => p.id)
    .filter((id): id is string => id !== undefined);
}
```

**Usage in Collision System:**
```typescript
const nearbyEntityIds = quadtree.queryIds(entityBoundingBox);
nearbyEntityIds.forEach(otherId => {
  if (otherId !== currentEntityId) {
    checkCollision(currentEntityId, otherId);
  }
});
```

### 2. Add `removePoint()` Method
Remove a specific point by entity ID.

```typescript
public removePoint(id: string): boolean {
  // Remove from current node
  const initialLength = this.points.length;
  this.points = this.points.filter(p => p.id !== id);

  if (this.points.length < initialLength) {
    return true; // Found and removed
  }

  // Recursively remove from quadrants
  if (this.hasQuadrants) {
    for (const quadrant of Object.values(this.quadrants)) {
      if (quadrant?.removePoint(id)) {
        return true;
      }
    }
  }

  return false;
}
```

**Usage:**
```typescript
// When entity is destroyed
onEntityDestroyed(entityId: string) {
  quadtree.removePoint(entityId);
}
```

### 3. Add `updatePoint()` Method
Update entity position without full rebuild.

```typescript
public updatePoint(id: string, newX: number, newY: number): boolean {
  const removed = this.removePoint(id);
  if (removed) {
    return this.addPoint(new Point(newX, newY, id));
  }
  return false;
}
```

**Usage:**
```typescript
// When entity moves
onPositionChanged(entityId: string, newPos: {x: number, y: number}) {
  quadtree.updatePoint(entityId, newPos.x, newPos.y);
}
```

### 4. Add Duplicate Prevention
Modify `addPoint()` to check for existing IDs.

```typescript
public addPoint(point: Point, allowDuplicates: boolean = false): boolean {
  if (!this.candidatePoint(point)) {
    return false;
  }

  // Prevent duplicates if point has an ID and allowDuplicates is false
  if (!allowDuplicates && point.id !== undefined) {
    if (this.hasPoint(point.id)) {
      return false; // Already exists
    }
  }

  this.points.push(point);

  // ... rest of existing logic
}

private hasPoint(id: string): boolean {
  // Check current node
  if (this.points.some(p => p.id === id)) {
    return true;
  }

  // Recursively check quadrants
  if (this.hasQuadrants) {
    return Object.values(this.quadrants).some(q => q?.hasPoint(id));
  }

  return false;
}
```

### 5. Add Convenience Method for ECS
Direct entity insertion without creating Point objects.

```typescript
public addEntity(x: number, y: number, entityId: string): boolean {
  return this.addPoint(new Point(x, y, entityId));
}
```

**Usage:**
```typescript
// In your collision system
entities.forEach(entity => {
  const pos = entity.getComponent(PositionComponent);
  quadtree.addEntity(pos.x, pos.y, entity.id);
});
```

### 6. Add Bulk Operations
Optimize for common ECS patterns.

```typescript
public addEntities(entities: Array<{x: number, y: number, id: string}>): void {
  entities.forEach(e => this.addEntity(e.x, e.y, e.id));
}

public rebuild(entities: Array<{x: number, y: number, id: string}>): void {
  this.clear();
  this.addEntities(entities);
}
```

**Usage:**
```typescript
// Typical ECS update pattern
class CollisionSystem extends System {
  update() {
    const entities = this.getEntitiesWithComponents([Position, Collider]);
    const positions = entities.map(e => ({
      x: e.position.x,
      y: e.position.y,
      id: e.id
    }));

    // Full rebuild each frame (simple approach)
    this.quadtree.rebuild(positions);

    // Check collisions
    entities.forEach(entity => {
      const nearbyIds = this.quadtree.queryIds(entity.collider.bounds);
      this.checkCollisions(entity.id, nearbyIds);
    });
  }
}
```

## Usage Patterns for ECS

### Pattern 1: Full Rebuild Each Frame (Simple)
```typescript
class CollisionSystem extends System {
  private quadtree: QuadTree;

  constructor() {
    const worldBounds = new Rectangle(1920, 1080, new Point(960, 540));
    this.quadtree = new QuadTree(worldBounds, 6, 8);
  }

  update() {
    // Clear and rebuild
    this.quadtree.clear();

    // Insert all entities
    this.entities.forEach(entity => {
      const pos = entity.getComponent(PositionComponent);
      this.quadtree.addEntity(pos.x, pos.y, entity.id);
    });

    // Query and check collisions
    this.entities.forEach(entity => {
      const bounds = entity.getComponent(ColliderComponent).bounds;
      const nearbyIds = this.quadtree.queryIds(bounds);

      nearbyIds.forEach(otherId => {
        if (otherId !== entity.id) {
          this.resolveCollision(entity.id, otherId);
        }
      });
    });
  }
}
```

### Pattern 2: Incremental Updates (Optimized)
```typescript
class CollisionSystem extends System {
  private quadtree: QuadTree;

  onEntityMoved(entityId: string, newX: number, newY: number) {
    this.quadtree.updatePoint(entityId, newX, newY);
  }

  onEntityDestroyed(entityId: string) {
    this.quadtree.removePoint(entityId);
  }

  onEntityCreated(entity: Entity) {
    const pos = entity.getComponent(PositionComponent);
    this.quadtree.addEntity(pos.x, pos.y, entity.id);
  }
}
```

### Pattern 3: Query-Only (External Management)
```typescript
class CollisionSystem extends System {
  // Quadtree rebuilt externally, just query here

  checkCollisionsForEntity(entityId: string, bounds: Rectangle): string[] {
    return this.quadtree.queryIds(bounds)
      .filter(id => id !== entityId);
  }
}
```

## Performance Considerations

### Current Performance Characteristics:
- **Insert:** O(log n) average, O(n) worst case (degenerate tree)
- **Query:** O(log n + k) where k = results
- **Clear:** O(1) for points, O(n) for recursive quadrants
- **No Remove:** N/A (not implemented)

### Recommended Configuration for ECS:
```typescript
// For 1000-5000 entities in 1920x1080 world
const quadtree = new QuadTree(
  worldBounds,
  maxDepth: 6,      // 2^6 = 64 subdivisions max
  maxPoints: 8      // 8 entities per leaf node
);

// For 100-1000 entities
maxDepth: 5, maxPoints: 4

// For 5000+ entities
maxDepth: 8, maxPoints: 16
```

## Testing Recommendations

Add ECS-specific test cases:

```typescript
describe("QuadTree ECS Integration", () => {
  it("should prevent duplicate entity IDs", () => {
    const qt = new QuadTree(area, 3, 3);
    const entityId = "player-1";

    qt.addEntity(100, 100, entityId);
    qt.addEntity(200, 200, entityId);  // Same ID, different position

    expect(qt.queryIds(area)).toEqual([entityId]); // Only one instance
  });

  it("should remove entity by ID", () => {
    const qt = new QuadTree(area, 3, 3);
    qt.addEntity(100, 100, "entity-1");
    qt.addEntity(200, 200, "entity-2");

    qt.removePoint("entity-1");

    expect(qt.queryIds(area)).toEqual(["entity-2"]);
  });

  it("should update entity position", () => {
    const qt = new QuadTree(area, 3, 3);
    qt.addEntity(100, 100, "entity-1");

    qt.updatePoint("entity-1", 500, 500);

    const nearOrigin = qt.queryIds(new Rectangle(200, 200, new Point(100, 100)));
    const nearNew = qt.queryIds(new Rectangle(200, 200, new Point(500, 500)));

    expect(nearOrigin).toHaveLength(0);
    expect(nearNew).toEqual(["entity-1"]);
  });

  it("should return entity IDs for collision detection", () => {
    const qt = new QuadTree(area, 5, 10);

    qt.addEntity(100, 100, "enemy-1");
    qt.addEntity(110, 110, "enemy-2");
    qt.addEntity(500, 500, "enemy-3");

    const playerBounds = new Rectangle(50, 50, new Point(100, 100));
    const nearbyEnemies = qt.queryIds(playerBounds);

    expect(nearbyEnemies).toContain("enemy-1");
    expect(nearbyEnemies).toContain("enemy-2");
    expect(nearbyEnemies).not.toContain("enemy-3");
  });
});
```

## Summary

**Current Implementation:** ⭐⭐⭐ (3/5 for ECS)
- Solid spatial partitioning algorithm
- Point.id field exists for entity binding
- Missing key ECS operations (remove, update, queryIds)

**With Proposed Improvements:** ⭐⭐⭐⭐⭐ (5/5 for ECS)
- Full entity lifecycle support
- Convenient ECS-specific API
- Optimized query patterns
- Duplicate prevention

**Action Items:**
1. Implement `queryIds()` method (easy win)
2. Implement `removePoint()` method (essential for entity destruction)
3. Add duplicate prevention to `addPoint()` (prevents bugs)
4. Consider `updatePoint()` for incremental updates (performance)
5. Add ECS-specific convenience methods (developer experience)
6. Document ECS usage patterns in README
