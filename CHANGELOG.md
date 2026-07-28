# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- Bounded items are no longer copied into every overlapping child quadrant. An item now stops at the deepest node that fully contains it and is stored exactly once, so a rectangle crossing a node's center stays on that node instead of fanning out to every leaf below it. Inserting 1000 overlapping 200×200 AABBs stored 168,004 copies before this change and stores 1,000 after.
- `clearPoints()` now empties the whole tree. On a subdivided tree it only reset the (already empty) root arrays while wiping the id registries, leaving every point queryable but impossible to `remove()`.
- `addPoint` / `addBounds` now replace an entry that is already registered under the same id instead of silently storing a second copy. Rejected inserts (outside `area`) leave the existing entry untouched.
- The id registries store position snapshots instead of live `Point` / `Rectangle` references, so `remove()` and `update*()` still find an entity whose position was mutated in place — the usual ECS pattern. Previously the lookup navigated to the *new* position and left a permanent duplicate behind.

### Added
- `queryBounds(area): BoundedItem[]` — bounded items were previously reachable only as bare ids through `queryIds`.
- `Quadrants` and `BoundedItem` are re-exported from the package index, so consumers can name the types.

### Changed
- Removal now collapses the tree. An emptied quadrant is dropped and leaf children are merged back into their parent once their combined count fits `maxPoints`, instead of leaving the structure permanently expanded at its high-water mark. A tree churned by 20 rounds of `updatePoint` over 2160 points now holds 501 nodes and queries in 3.3 µs, against 1365 nodes and 7.1 µs before; both figures now match a tree built from scratch at the same positions.
- The `QuadTree` constructor no longer takes the internal registries as trailing parameters; child nodes inherit them from their parent. The documented signature `(area, maxDepth, maxPoints, depth?)` is authoritative again.
- `updatePoint` / `updateBounds` no longer drop the entity when the new position falls outside `area`. They return `false` and leave it where it was, matching `addPoint` / `addBounds`.

### Performance
- Exactly-once storage of bounded items removes the need to deduplicate query results, so `queryIds` no longer builds a `Set`. On the benchmark trees: points 79k → 211k ops/s, normal AABBs 48k → 148k ops/s, and the dense-overlap case 209 → 71k ops/s (4.8 ms → 0.014 ms per query). Inserting 1000 overlapping AABBs drops from 42 ms to 1.2 ms.
- Removals no longer rebuild the bucket array. `points`/`boundedItems` use a swap-with-last removal instead of `filter`, dropping the per-removal array and closure allocation; removing 1000 straddling AABBs went from 7.7 ms to 2.5 ms.
- `query` no longer collects bounded items into an array it throws away, and `queryBounds` skips the point scan entirely (0.67 µs against 2.0 µs for `query` on the benchmark tree).
- `updatePoint` / `updateBounds` re-register an id by mutating its registry entry in place instead of deleting and re-inserting it. `Map.delete` followed by `Map.set` of the same key costs ~10 µs on a registry of a few thousand ids (V8 rehashes), which dominated the whole update path: the `Incremental Update (Point)` benchmark goes from 89k to 4.1M ops/s. `remove()` still deletes and pays that cost, so prefer `updatePoint` over `remove` + `addPoint` when an entity is moving rather than leaving.

## [1.0.3] - 2026-07-28

### Added
- AABB support: `addBounds(id, bounds)` stores a `Rectangle` against an id, alongside the existing points. New public `boundedItems: BoundedItem[]` per node and an exported `BoundedItem` interface.
- `queryIds(area): string[]` — ids of the points and bounded items intersecting an area, for ECS systems that work in entity ids rather than geometry.
- `remove(id)`, `updatePoint(id, newPoint)` and `updateBounds(id, newBounds)`, backed by id → position registries on the root node so an entity can be re-indexed without rebuilding the tree.
- `npm run typecheck` (`tsc --noEmit`), wired in as `prebuild`; `isolatedModules` in `tsconfig.json`.

## [1.0.2] - 2026-04-16

### Changed
- Trimmed published npm tarball: excluded `.idea/` (JetBrains metadata) and `eslint.config.js` (dev tooling).

## [1.0.1] - 2026-04-16

### Changed
- Internal rewrite of `QuadTree` for ~4× faster queries and insertions:
  - `addPoint` routes directly to children when already subdivided (no push-then-clear).
  - Subdivision is one-shot via a new internal `subdivide()`; children are lazy-allocated.
  - Quadrant classification uses center comparison instead of 4× rectangle intersection tests.
  - `query` uses a shared accumulator (no per-node `Object.values` / `concat` allocation).
- Branch on `hasQuadrants` (not `points.length`) in `query` for robustness.

### Added
- `eslint.config.js` (ESLint 9 flat config) with `typescript-eslint`.

### Fixed
- Resolved transitive dependency vulnerabilities (flatted, minimatch, picomatch, rollup, vite) via `npm audit fix`.

## [1.0.0] - 2025-12-23

### Added
- `QuadTree` class with spatial partitioning and auto-subdivision
- `addPoint` — insert points with automatic quadrant splitting
- `query` — find all points within a rectangular area
- `clear` / `clearPoints` — reset tree state
- Configurable `maxDepth` and `maxPoints` per node
- Interactive canvas demo with click-drag point insertion
- Unit tests (8 tests) and benchmarks
- esbuild bundling configuration
- ESLint configuration
