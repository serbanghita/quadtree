import QuadTree from "./QuadTree";
import { Rectangle, Point } from "@serbanghita-gamedev/geometry";
import { bench, describe } from "vitest";

let area: Rectangle, pointTree: QuadTree, aabbTree: QuadTree, denseTree: QuadTree, queryArea: Rectangle;
let pointIds: string[];

// Called once: every bench below is written to leave its tree the same size it
// found it, so the trees can be shared across runs.
function setupTrees() {
  area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
  
  // 1. Point Tree
  pointTree = new QuadTree(area, 5, 10);
  pointIds = [];
  let idCounter = 0;
  for (let x = 0; x < 640 / 2; x += 6) {
    for (let y = 0; y < 480 / 2; y += 6) {
      const id = `p-${idCounter++}`;
      pointIds.push(id);
      pointTree.addPoint(new Point(x, y, id));
    }
  }

  // 2. AABB Tree (Normal Distribution)
  aabbTree = new QuadTree(area, 5, 10);
  for (let x = 0; x < 640 / 2; x += 6) {
    for (let y = 0; y < 480 / 2; y += 6) {
      aabbTree.addBounds(`b-${x}-${y}`, new Rectangle(10, 10, new Point(x, y)));
    }
  }

  // 3. AABB Tree (High Density Overlap)
  // We insert points to force subdivision, then insert dense AABBs
  denseTree = new QuadTree(area, 5, 10);
  denseTree.addPoint(new Point(10, 10));
  denseTree.addPoint(new Point(600, 10));
  denseTree.addPoint(new Point(10, 400));
  denseTree.addPoint(new Point(600, 400));
  for (let i = 0; i < 1000; i++) {
    // Large rectangles covering the center
    denseTree.addBounds(`dense-${i}`, new Rectangle(200, 200, new Point(320, 240)));
  }

  queryArea = new Rectangle(200, 200, new Point(640 / 2, 480 / 2));
}

describe("QuadTree Benchmarks", () => {
  setupTrees();

  bench("query (Points Only)", () => {
    pointTree.query(queryArea);
  });

  bench("queryIds (Points Only)", () => {
    pointTree.queryIds(queryArea);
  });

  bench("queryIds (AABBs Normal)", () => {
    aabbTree.queryIds(queryArea);
  });

  bench("queryIds (AABBs Dense Overlap)", () => {
    denseTree.queryIds(queryArea);
  });
  
  // Re-adding a known id replaces it, so the tree stays the same size across iterations.
  bench("addBounds (descends to a leaf)", () => {
    aabbTree.addBounds("probe", new Rectangle(8, 8, new Point(100, 100)));
  });

  bench("addBounds (straddles the center, stays at the root)", () => {
    aabbTree.addBounds("probe", new Rectangle(400, 400, new Point(320, 240)));
  });

  bench("Incremental Update (Point)", () => {
    pointTree.updatePoint("p-10", new Point(100, 100, "p-10"));
  });

  let scatter = 0;
  bench("Incremental Update (Point, scattered)", () => {
    const id = pointIds[scatter++ % pointIds.length];
    pointTree.updatePoint(id, new Point(10 + (scatter % 300), 10 + (scatter % 200), id));
  });
});
