# Quadtree

## Overview

Spatial partitioning quadtree for efficient 2D point queries. Auto-subdivides when point capacity is exceeded, up to a configurable maximum depth. Published as `@serbanghita-gamedev/quadtree` (ESM).

## Source Structure

| File | Description |
|------|-------------|
| `src/QuadTree.ts` | Core quadtree: addPoint, query, auto-subdivision, clear |
| `src/index.ts` | Public API re-export (only `QuadTree`) |
| `src/QuadTree.test.ts` | Unit tests |
| `src/QuadTree.bench.ts` | Query benchmark |
| `demo/main.ts` | Interactive canvas demo with click-drag point insertion |

## Public API

`src/index.ts` re-exports the `QuadTree` class plus the `Quadrants` and `BoundedItem` types.

### Constructor

`new QuadTree(area: Rectangle, maxDepth: number, maxPoints: number, depth = 0)`

### Methods

| Method | Description |
|--------|-------------|
| `addPoint(point): boolean` | Insert; returns false if point lies outside `area`. Triggers subdivision when stored count exceeds `maxPoints` and `depth < maxDepth` |
| `addBounds(id, bounds): boolean` | Insert an AABB; returns false if it does not intersect `area` |
| `remove(id): boolean` | Remove the point or bounds registered under `id` |
| `updatePoint(id, newPoint): boolean` | Re-index a moved point; returns false (leaving it in place) if the new position is outside `area` |
| `updateBounds(id, newBounds): boolean` | Re-index moved bounds; same rejection rule |
| `query(area): Point[]` | Find points intersecting `area`. Bounded items are **not** included |
| `queryBounds(area): BoundedItem[]` | Find bounded items intersecting `area`. Points are not included |
| `queryIds(area): string[]` | Ids of both points and bounded items intersecting `area` |
| `clear()` | Reset points, bounded items and child quadrants |
| `clearPoints()` | Reset points and bounded items recursively through the whole tree, keeping the quadrant structure |

### Readonly Properties

`area`, `maxDepth`, `maxPoints`, `depth`, plus mutable `points: Point[]`, `boundedItems: BoundedItem[]`, `quadrants: Quadrants`, `hasQuadrants: boolean`.

## Behavioral Invariants

- After subdivision, the parent node's `points` array is cleared — points live only in leaf quadrants. `query` branches on `hasQuadrants`, not on `points.length`.
- Bounded items are stored **exactly once**, on the deepest node whose `area` fully contains them; an item straddling a node's center stays on that node rather than being copied into each overlapping child. So internal nodes may hold `boundedItems`, and `queryInto` scans `boundedItems` at every node it visits while scanning `points` only at leaves. Because storage is exactly-once, `queryIds` needs no deduplication.
- Subdivision is one-shot, tracked by the private `hasSubdivided`. The public `hasQuadrants` means "at least one child object exists" and can still be false after subdividing — a node whose items all straddle its center allocates no children. Route on `hasSubdivided`, recurse on `hasQuadrants`.
- Children are allocated **lazily** — only the quadrants that actually receive a point or a contained item are created.
- Quadrant assignment for points is by center comparison: boundary points where `x === center.x` or `y === center.y` go to the top/left side. `childContaining` follows the same tie-break for bounds.
- `createChild` builds one quadrant on demand; no throwaway allocations on inserts.
- Out-of-bounds entries in `points` (e.g. from direct mutation of the public field) are silently dropped during subdivision — they fail the area check and are not routed.
- Leaves at `depth === maxDepth` keep all points unconditionally (never subdivide).
- Removal is the inverse of subdivision: as the recursion unwinds, `pruneChild` drops an emptied quadrant and merges leaf children back into their parent once their combined count fits `maxPoints`, so a branch collapses bottom-up in one pass. A tree that has been churned ends up with the same node count as one built from scratch at the same positions. The cost is that a node sitting exactly at `maxPoints` splits and merges on every add/remove cycle (~1 µs vs ~0.4 µs if the merge threshold were lowered) — measured and accepted in favour of query speed.
- `queryInto` takes `null` for either accumulator to skip collecting that kind, which is how `query` avoids touching bounded items and `queryBounds` avoids touching points.
- Ids are unique across the tree: inserting an id that is already registered removes the previous entry first (a point can be replaced by bounds and vice versa). An insert or update rejected for falling outside `area` has no side effects — the previous entry stays put and the call returns `false`.
- The id registries hold position *snapshots*, not references, so removal still works after a caller mutates a `Point` or `Rectangle` in place. Registries live on the root and are shared by reference with every child.
- Re-registering an id mutates its existing snapshot rather than deleting and re-inserting the Map entry. `Map.delete` + `Map.set` of the same key costs ~10 µs on a registry of a few thousand ids and used to dominate the update path — do not "simplify" `registerPoint` / `registerBounds` back into `remove()` + `set()`.

## Dependencies

| Package | Version |
|---------|---------|
| `@serbanghita-gamedev/geometry` | ^1.0.0 |

Uses `Rectangle` (with `intersects`, `intersectsWithPoint`) and `Point`.

## Development

| Command | What it does |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Bundle with esbuild → `dist/quadtree.js` |
| `npm run test` | Run tests (vitest, non-watch) |
| `npm run lint` | Lint (eslint) |
| `npm run demo` | Interactive canvas demo (vite, auto-opens) |
| `npx vitest bench` | Run benchmarks |

## Coding Guidelines

- Keep the core implementation minimal and focused.
- Avoid unnecessary comments in code.
- See `ECS_INTEGRATION_PROPOSAL.md` for planned API enhancements (entity-id attachment for ECS systems).
