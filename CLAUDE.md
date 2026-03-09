# Quadtree

## Overview

Spatial partitioning quadtree for efficient 2D point queries. Auto-subdivides when point capacity is exceeded, up to a configurable maximum depth.

## Source Structure

| File | Description |
|------|-------------|
| `src/QuadTree.ts` | Core quadtree: addPoint, query, auto-subdivision, clear |
| `src/index.ts` | Public API re-export |
| `demo/main.ts` | Interactive canvas demo with click-drag point insertion |

## Key Exports

| Export | Type | Description |
|--------|------|-------------|
| `QuadTree` | Class | `(area, maxDepth, maxPoints, depth?)` spatial partitioning |
| `Quadrants` | Type | `{ topLeft?, topRight?, bottomLeft?, bottomRight? }` |

### QuadTree Public API

| Method/Property | Description |
|-----------------|-------------|
| `addPoint(point: Point): boolean` | Insert a point; triggers subdivision if needed |
| `query(area: Rectangle): Point[]` | Find all points within a rectangular area |
| `clear(): void` | Clear all points and quadrants |
| `clearPoints(): void` | Clear points only, keep quadrants |
| `points: Point[]` | Current points in this node |
| `quadrants: Quadrants` | Child quadtree nodes |
| `hasQuadrants: boolean` | Whether this node has been subdivided |

## Dependencies

| Package | Version |
|---------|---------|
| `@serbanghita-gamedev/geometry` | ^1.0.0 |

## Development

| Command | What it does |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run build` | Bundle with esbuild |
| `npm run test` | Run tests (vitest) |
| `npm run lint` | Lint (eslint) |
| `npm run demo` | Interactive canvas demo (vite) |

## Testing

- Framework: Vitest
- Tests: `src/QuadTree.test.ts`
- Benchmarks: `src/QuadTree.bench.ts`

## Coding Guidelines

- Keep the core implementation minimal and focused.
- Avoid unnecessary comments in code.
- See `ECS_INTEGRATION_PROPOSAL.md` for planned API enhancements.
