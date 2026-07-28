import QuadTree from "./QuadTree";
import { Rectangle, Point } from "@serbanghita-gamedev/geometry";
import { bench, describe } from "vitest";

let area: Rectangle, pointTree: QuadTree, aabbTree: QuadTree, denseTree: QuadTree, queryArea: Rectangle;

function beforeEachTest() {
  area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
  
  // 1. Point Tree
  pointTree = new QuadTree(area, 5, 10);
  let idCounter = 0;
  for (let x = 0; x < 640 / 2; x += 6) {
    for (let y = 0; y < 480 / 2; y += 6) {
      pointTree.addPoint(new Point(x, y, `p-${idCounter++}`));
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
  beforeEachTest();

  bench("query (Points Only) - Array Return", () => {
    pointTree.query(queryArea);
  });

  bench("queryIds (Points Only) - Set Deduplication", () => {
    pointTree.queryIds(queryArea);
  });

  bench("queryIds (AABBs Normal) - Set Deduplication", () => {
    aabbTree.queryIds(queryArea);
  });

  bench("queryIds (AABBs Dense Overlap) - Set Deduplication", () => {
    denseTree.queryIds(queryArea);
  });
  
  bench("addBounds (Small)", () => {
    const t = new QuadTree(area, 5, 10);
    t.addBounds("test", new Rectangle(10, 10, new Point(100, 100)));
  });

  bench("addBounds (Massive - forces recursion)", () => {
    const t = new QuadTree(area, 5, 10);
    // Add points to force subdivision
    t.addPoint(new Point(10, 10));
    t.addPoint(new Point(600, 10));
    t.addPoint(new Point(10, 400));
    t.addBounds("massive", new Rectangle(1000, 1000, new Point(320, 240)));
  });
  
  bench("Incremental Update (Point)", () => {
    pointTree.updatePoint("p-10", new Point(100, 100, "p-10"));
  });
});
