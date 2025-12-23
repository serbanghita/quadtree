import QuadTree from '../src/QuadTree.js';
import { Point, Rectangle } from '@serbanghita-gamedev/geometry';

// Constants
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const MAX_DEPTH = 6;
const MAX_POINTS = 4;
const POINT_RADIUS = 3;
const BOUNDARY_COLOR = '#cccccc';
const POINT_COLOR = '#ff0000';

// Get canvas and context
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Initialize quadtree
const rootArea = new Rectangle(
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  new Point(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
);
const quadtree = new QuadTree(rootArea, MAX_DEPTH, MAX_POINTS);

// Track mouse drawing state
let isDrawing = false;

// Draw all points in the quadtree
function drawPoints() {
  function drawPointsRecursive(node: QuadTree) {
    // Draw points in current node
    node.points.forEach(point => {
      ctx.fillStyle = POINT_COLOR;
      ctx.beginPath();
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // Recursively draw points in child quadrants
    if (node.hasQuadrants) {
      Object.values(node.quadrants).forEach(childQuadrant => {
        if (childQuadrant) {
          drawPointsRecursive(childQuadrant);
        }
      });
    }
  }

  drawPointsRecursive(quadtree);
}

// Draw all boundaries in the quadtree
function drawBoundaries() {
  function drawBoundariesRecursive(node: QuadTree) {
    const rect = node.area;

    ctx.strokeStyle = BOUNDARY_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      rect.topLeftX,
      rect.topLeftY,
      rect.width,
      rect.height
    );

    // Recursively draw boundaries of child quadrants
    if (node.hasQuadrants) {
      Object.values(node.quadrants).forEach(childQuadrant => {
        if (childQuadrant) {
          drawBoundariesRecursive(childQuadrant);
        }
      });
    }
  }

  drawBoundariesRecursive(quadtree);
}

// Count all points in the quadtree
function countAllPoints(): number {
  function countRecursive(node: QuadTree): number {
    let count = node.points.length;

    if (node.hasQuadrants) {
      Object.values(node.quadrants).forEach(childQuadrant => {
        if (childQuadrant) {
          count += countRecursive(childQuadrant);
        }
      });
    }

    return count;
  }

  return countRecursive(quadtree);
}

// Count all quadrants in the quadtree
function countQuadrants(): number {
  function countRecursive(node: QuadTree): number {
    let count = 0;

    if (node.hasQuadrants) {
      count = Object.values(node.quadrants).filter(q => q).length;

      Object.values(node.quadrants).forEach(childQuadrant => {
        if (childQuadrant) {
          count += countRecursive(childQuadrant);
        }
      });
    }

    return count;
  }

  return countRecursive(quadtree);
}

// Render the entire visualization
function render() {
  // Clear canvas with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw in order: boundaries first, then points
  drawBoundaries();
  drawPoints();

  // Update stats
  const stats = document.getElementById('stats')!;
  stats.textContent = `Points: ${countAllPoints()} | Quadrants: ${countQuadrants()}`;
}

// Helper function to add point at mouse position
function addPointAtPosition(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const point = new Point(x, y);
  quadtree.addPoint(point);

  render();
}

// Mouse down handler - start drawing
canvas.addEventListener('mousedown', (e: MouseEvent) => {
  isDrawing = true;
  addPointAtPosition(e);
});

// Mouse move handler - continue drawing if mouse is pressed
canvas.addEventListener('mousemove', (e: MouseEvent) => {
  if (isDrawing) {
    addPointAtPosition(e);
  }
});

// Mouse up handler - stop drawing
canvas.addEventListener('mouseup', () => {
  isDrawing = false;
});

// Mouse leave handler - stop drawing if mouse leaves canvas
canvas.addEventListener('mouseleave', () => {
  isDrawing = false;
});

// Clear button handler
document.getElementById('clearBtn')!.addEventListener('click', () => {
  quadtree.clear();
  render();
});

// Initial render
render();
