# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
