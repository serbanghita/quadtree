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

`QuadTree` is the sole re-export from `src/index.ts`. The `Quadrants` type is exported from `QuadTree.ts` but not re-exported from the index.

### Constructor

`new QuadTree(area: Rectangle, maxDepth: number, maxPoints: number, depth = 0)`

### Methods

| Method | Description |
|--------|-------------|
| `addPoint(point): boolean` | Insert; returns false if point lies outside `area`. Triggers subdivision when `points.length > maxPoints` and `depth < maxDepth` |
| `query(area): Point[]` | Find points intersecting `area` (recurses into child quadrants) |
| `clear()` | Reset points and child quadrants |
| `clearPoints()` | Reset points only |

### Readonly Properties

`area`, `maxDepth`, `maxPoints`, `depth`, plus mutable `points: Point[]`, `quadrants: Quadrants`, `hasQuadrants: boolean`.

## Behavioral Invariants

- After subdivision, the parent node's `points` array is cleared — points live only in leaf quadrants. `query` branches on `hasQuadrants`, not on `points.length`.
- Subdivision is one-shot: on the transition, `subdivide()` routes existing points to children, then subsequent `addPoint` calls route directly via `routePoint` without touching `this.points`.
- Children are allocated **lazily** — only the quadrants that actually receive a point are created. `hasQuadrants` flips true the moment the first child is allocated.
- Quadrant assignment is by center comparison (not intersection iteration): boundary points where `x === center.x` or `y === center.y` go to the top/left side.
- `createChild` builds one quadrant on demand; no throwaway allocations on inserts.
- Out-of-bounds entries in `points` (e.g. from direct mutation of the public field) are silently dropped during `subdivide` — they fail the area check and are not routed.
- Leaves at `depth === maxDepth` keep all points unconditionally (never subdivide).

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
