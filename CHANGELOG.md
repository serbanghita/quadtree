# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
