import { Rectangle, Point } from "@serbanghita-gamedev/geometry";
import QuadTree from "./QuadTree";

describe("QuadTree", () => {
  it("addPoint outside the area", () => {
    const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
    const q = new QuadTree(area, 3, 3);

    expect(q.addPoint(new Point(1000, 1000))).toBe(false);
  });

  it("misplaced Points are note redistributed", () => {
    const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
    const q = new QuadTree(area, 3, 3);
    q.points = [new Point(1000, 1000), new Point(2000, 2000), new Point(3000, 3000), new Point(4000, 4000)];

    q.addPoint(new Point(100, 100));

    expect(q.query(area)).toHaveLength(1);
  });

  it("1 quadtree with maxPoints", () => {
    const areaCenterPoint = new Point(640 / 2, 480 / 2);
    const area = new Rectangle(640, 480, areaCenterPoint);
    const q = new QuadTree(area, 3, 3);

    q.addPoint(new Point(10, 50));
    q.addPoint(new Point(10, 70));
    q.addPoint(new Point(10, 80));

    expect(q.hasQuadrants).toBe(false);
    expect(q.points).toHaveLength(3);
    expect(q.quadrants).toEqual({});
  });

  it("4 sub quadtrees with maxPoints", () => {
    const areaCenterPoint = new Point(640 / 2, 480 / 2);
    const area = new Rectangle(640, 480, areaCenterPoint);
    const rootQuadTree = new QuadTree(area, 3, 3);

    rootQuadTree.addPoint(new Point(10, 50));
    rootQuadTree.addPoint(new Point(10, 70));
    rootQuadTree.addPoint(new Point(10, 80));

    rootQuadTree.addPoint(new Point(400, 50));
    rootQuadTree.addPoint(new Point(400, 70));
    rootQuadTree.addPoint(new Point(400, 80));

    rootQuadTree.addPoint(new Point(100, 450));
    rootQuadTree.addPoint(new Point(100, 470));
    rootQuadTree.addPoint(new Point(100, 480));

    rootQuadTree.addPoint(new Point(400, 450));
    rootQuadTree.addPoint(new Point(400, 470));
    rootQuadTree.addPoint(new Point(400, 480));

    expect(rootQuadTree.hasQuadrants).toBe(true);
    expect(rootQuadTree.points).toHaveLength(0);

    expect(rootQuadTree.quadrants.topLeft?.points).toHaveLength(3);
    expect(rootQuadTree.quadrants.topLeft?.hasQuadrants).toBe(false);
    expect(rootQuadTree.quadrants.topRight?.points).toHaveLength(3);
    expect(rootQuadTree.quadrants.topRight?.hasQuadrants).toBe(false);
    expect(rootQuadTree.quadrants.bottomLeft?.points).toHaveLength(3);
    expect(rootQuadTree.quadrants.bottomLeft?.hasQuadrants).toBe(false);
    expect(rootQuadTree.quadrants.bottomRight?.points).toHaveLength(3);
    expect(rootQuadTree.quadrants.bottomRight?.hasQuadrants).toBe(false);
  });

  it("3 level quadrants, points belong to the lowest level quadrants", () => {
    const areaCenterPoint = new Point(640 / 2, 480 / 2);
    const area = new Rectangle(640, 480, areaCenterPoint);
    const rootQuadTree = new QuadTree(area, 3, 3);

    rootQuadTree.addPoint(new Point(100, 50));
    rootQuadTree.addPoint(new Point(100, 70));
    rootQuadTree.addPoint(new Point(100, 80));
    rootQuadTree.addPoint(new Point(200, 80));

    expect(rootQuadTree.hasQuadrants).toBe(true);
    expect(rootQuadTree.points).toHaveLength(0);
    expect(rootQuadTree.quadrants).toHaveProperty("topLeft");
    expect(rootQuadTree.quadrants).not.toHaveProperty("topRight");
    expect(rootQuadTree.quadrants).not.toHaveProperty("bottomLeft");
    expect(rootQuadTree.quadrants).not.toHaveProperty("bottomRight");

    expect(rootQuadTree.quadrants.topLeft?.points).toHaveLength(0);
    expect(rootQuadTree.quadrants.topLeft?.hasQuadrants).toBe(true);

    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.points).toHaveLength(3);
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topRight?.points).toHaveLength(1);
    expect(rootQuadTree.quadrants.topLeft?.quadrants.bottomLeft).toBeUndefined();
    expect(rootQuadTree.quadrants.topLeft?.quadrants.bottomRight).toBeUndefined();
  });

  it("maxDepth", () => {
    const areaCenterPoint = new Point(640 / 2, 480 / 2);
    const area = new Rectangle(640, 480, areaCenterPoint);
    const rootQuadTree = new QuadTree(area, 3, 1);

    rootQuadTree.addPoint(new Point(10, 10));
    rootQuadTree.addPoint(new Point(10, 20));
    rootQuadTree.addPoint(new Point(10, 30));
    rootQuadTree.addPoint(new Point(10, 40));
    rootQuadTree.addPoint(new Point(10, 50));

    expect(rootQuadTree.hasQuadrants).toBe(true);
    expect(rootQuadTree.depth).toEqual(0);
    expect(rootQuadTree.points.length).toEqual(0);
    expect(rootQuadTree.quadrants).toHaveProperty("topLeft");
    expect(rootQuadTree.quadrants).not.toHaveProperty("topRight");
    expect(rootQuadTree.quadrants).not.toHaveProperty("bottomLeft");
    expect(rootQuadTree.quadrants).not.toHaveProperty("bottomRight");

    expect(rootQuadTree.quadrants.topLeft?.hasQuadrants).toBe(true);
    expect(rootQuadTree.quadrants.topLeft?.depth).toEqual(1);
    expect(rootQuadTree.quadrants.topLeft?.points.length).toEqual(0);
    expect(rootQuadTree.quadrants.topLeft?.quadrants).toHaveProperty("topLeft");
    expect(rootQuadTree.quadrants.topLeft?.quadrants).not.toHaveProperty("topRight");
    expect(rootQuadTree.quadrants.topLeft?.quadrants).not.toHaveProperty("bottomLeft");
    expect(rootQuadTree.quadrants.topLeft?.quadrants).not.toHaveProperty("bottomRight");

    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.hasQuadrants).toBe(true);
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.depth).toEqual(2);
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.points.length).toEqual(0);
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.quadrants).toHaveProperty("topLeft");
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.quadrants).not.toHaveProperty("topRight");
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.quadrants).not.toHaveProperty("bottomLeft");
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.quadrants).not.toHaveProperty("bottomRight");

    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.quadrants.topLeft?.hasQuadrants).toBe(false);
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.quadrants.topLeft?.depth).toEqual(3);
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.quadrants.topLeft?.points.length).toEqual(5);
    expect(rootQuadTree.quadrants.topLeft?.quadrants.topLeft?.quadrants.topLeft?.quadrants).toEqual({});
  });

  describe("query", () => {
    it("no quadrants, single point", async () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const quadtree = new QuadTree(area, 5, 10);

      const points = [
        // Inside
        [270, 230],
      ];

      points.forEach(([x, y]) => quadtree.addPoint(new Point(x, y)));

      const pointsFound = quadtree.query(new Rectangle(120, 120, new Point(640 / 2, 480 / 2)));

      expect(quadtree.hasQuadrants).toBe(false);
      expect(quadtree.quadrants).toEqual({});
      expect(pointsFound).toHaveLength(1);
    });

    it("find 5 points", async () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const quadtree = new QuadTree(area, 5, 3);

      const points = [
        // Outside
        [100, 100],
        [100, 110],
        [100, 120],
        [100, 130],
        [100, 140],
        // Inside
        [270, 230],
        [270, 240],
        [270, 250],
        [270, 260],
        [270, 270],
      ];

      points.forEach(([x, y]) => quadtree.addPoint(new Point(x, y)));

      const pointsFound = quadtree.query(new Rectangle(120, 120, new Point(640 / 2, 480 / 2)));

      expect(quadtree.hasQuadrants).toBe(true);
      expect(quadtree.quadrants).toHaveProperty("topLeft");
      expect(quadtree.quadrants).not.toHaveProperty("topRight");
      expect(quadtree.quadrants).toHaveProperty("bottomLeft");
      expect(quadtree.quadrants).not.toHaveProperty("bottomRight");
      expect(pointsFound).toHaveLength(5);
    });
  });

  describe("AABB and Incremental Updates", () => {
    it("bounds crossing the center are stored once, on the node that contains them", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      // Add points to different quadrants to force root subdivision
      // but prevent immediate children from subdividing
      q.addPoint(new Point(10, 10));     // topLeft
      q.addPoint(new Point(600, 10));    // topRight
      q.addPoint(new Point(10, 400));    // bottomLeft

      const largeBounds = new Rectangle(400, 400, new Point(320, 240));
      q.addBounds("bg-1", largeBounds);

      expect(q.hasQuadrants).toBe(true);
      expect(q.boundedItems).toHaveLength(1);
      expect(q.quadrants.topLeft?.boundedItems).toHaveLength(0);
      expect(q.quadrants.topRight?.boundedItems).toHaveLength(0);
      expect(q.quadrants.bottomLeft?.boundedItems).toHaveLength(0);
      expect(q.quadrants.bottomRight?.boundedItems).toBeUndefined();
      expect(q.queryIds(area)).toEqual(["bg-1"]);
    });

    it("bounds that fit inside one quadrant descend into it", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10));
      q.addPoint(new Point(600, 10));
      q.addPoint(new Point(10, 400));

      q.addBounds("b-1", new Rectangle(20, 20, new Point(500, 100)));

      expect(q.boundedItems).toHaveLength(0);
      expect(q.quadrants.topRight?.boundedItems).toHaveLength(1);
      expect(q.quadrants.topLeft?.boundedItems).toHaveLength(0);
    });

    it("bounds larger than the root area stay at the root", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10));
      q.addPoint(new Point(600, 10));
      q.addPoint(new Point(10, 400));

      expect(q.addBounds("huge", new Rectangle(2000, 2000, new Point(320, 240)))).toBe(true);
      expect(q.boundedItems).toHaveLength(1);
      expect(q.queryIds(new Rectangle(10, 10, new Point(600, 400)))).toContain("huge");
    });

    it("overlapping bounds are never duplicated, however many are added", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 5, 10);

      q.addPoint(new Point(10, 10));
      q.addPoint(new Point(600, 10));
      q.addPoint(new Point(10, 400));
      q.addPoint(new Point(600, 400));

      for (let i = 0; i < 200; i++) {
        q.addBounds(`d-${i}`, new Rectangle(200, 200, new Point(320, 240)));
      }

      const countStored = (node: QuadTree): number => {
        let total = node.points.length + node.boundedItems.length;
        for (const child of [node.quadrants.topLeft, node.quadrants.topRight, node.quadrants.bottomLeft, node.quadrants.bottomRight]) {
          if (child) total += countStored(child);
        }
        return total;
      };

      expect(countStored(q)).toBe(204);

      const ids = q.queryIds(new Rectangle(200, 200, new Point(320, 240)));
      expect(ids.filter((id) => id === "d-0")).toHaveLength(1);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("a node whose items all straddle the center subdivides only once", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 5, 2);

      for (let i = 0; i < 20; i++) {
        q.addBounds(`s-${i}`, new Rectangle(400, 400, new Point(320, 240)));
      }

      expect(q.boundedItems).toHaveLength(20);
      expect(q.hasQuadrants).toBe(false);
      expect(q.queryIds(area)).toHaveLength(20);
      expect(q.remove("s-5")).toBe(true);
      expect(q.queryIds(area)).toHaveLength(19);
    });

    it("queryIds deduplicates returned ids", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);
      
      q.addPoint(new Point(10, 10, "p-1"));
      q.addPoint(new Point(10, 20, "p-2"));
      q.addPoint(new Point(10, 30, "p-3"));
      
      const largeBounds = new Rectangle(400, 400, new Point(320, 240));
      q.addBounds("bg-1", largeBounds);
      
      // Query an area that encompasses the entire tree
      const ids = q.queryIds(area);
      expect(ids).toHaveLength(4);
      expect(ids).toContain("p-1");
      expect(ids).toContain("p-2");
      expect(ids).toContain("p-3");
      expect(ids).toContain("bg-1");
    });
    
    it("emptied quadrants are pruned and the tree collapses back to a leaf", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 5, 2);

      for (let i = 0; i < 50; i++) {
        q.addPoint(new Point((i * 13) % 640, (i * 29) % 480, `p-${i}`));
      }
      expect(q.hasQuadrants).toBe(true);

      for (let i = 0; i < 50; i++) {
        expect(q.remove(`p-${i}`)).toBe(true);
      }

      expect(q.hasQuadrants).toBe(false);
      expect(q.quadrants).toEqual({});
      expect(q.query(area)).toHaveLength(0);

      // and the collapsed tree still behaves like a fresh one
      q.addPoint(new Point(100, 100, "again"));
      expect(q.points).toHaveLength(1);
      expect(q.query(area)).toHaveLength(1);
    });

    it("a subtree that thins out below maxPoints merges back into one leaf", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 4);

      q.addPoint(new Point(10, 10, "tl-1"));
      q.addPoint(new Point(20, 20, "tl-2"));
      q.addPoint(new Point(600, 10, "tr-1"));
      q.addPoint(new Point(10, 400, "bl-1"));
      q.addPoint(new Point(600, 400, "br-1"));
      expect(q.hasQuadrants).toBe(true);
      expect(q.points).toHaveLength(0);

      expect(q.remove("br-1")).toBe(true);

      expect(q.hasQuadrants).toBe(false);
      expect(q.quadrants).toEqual({});
      expect(q.points).toHaveLength(4);
      expect(q.queryIds(area).sort()).toEqual(["bl-1", "tl-1", "tl-2", "tr-1"]);
    });

    it("merging stops at a quadrant that is still subdivided", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10, "tl-1"));
      q.addPoint(new Point(20, 20, "tl-2"));
      q.addPoint(new Point(30, 30, "tl-3"));
      q.addPoint(new Point(600, 400, "br-1"));
      expect(q.quadrants.topLeft?.hasQuadrants).toBe(true);

      expect(q.remove("br-1")).toBe(true);

      expect(q.quadrants).not.toHaveProperty("bottomRight");
      expect(q.quadrants).toHaveProperty("topLeft");
      expect(q.hasQuadrants).toBe(true);
      expect(q.queryIds(area).sort()).toEqual(["tl-1", "tl-2", "tl-3"]);
    });

    it("queryBounds returns the bounded items that query() omits", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10, "p-1"));
      q.addBounds("b-1", new Rectangle(20, 20, new Point(100, 100)));
      q.addBounds("b-2", new Rectangle(20, 20, new Point(600, 400)));

      const found = q.queryBounds(new Rectangle(60, 60, new Point(100, 100)));
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe("b-1");
      expect(found[0].bounds.center.x).toBe(100);

      expect(q.query(area)).toHaveLength(1);
      expect(q.queryBounds(area)).toHaveLength(2);
    });

    it("clearPoints empties the whole tree, not just the root node", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10, "p-1"));
      q.addPoint(new Point(20, 20, "p-2"));
      q.addPoint(new Point(600, 400, "p-3"));
      q.addBounds("b-1", new Rectangle(400, 400, new Point(320, 240)));
      expect(q.hasQuadrants).toBe(true);

      q.clearPoints();

      expect(q.query(area)).toHaveLength(0);
      expect(q.queryIds(area)).toHaveLength(0);
      expect(q.quadrants.topLeft?.points).toHaveLength(0);
      expect(q.quadrants.topLeft?.boundedItems).toHaveLength(0);
      expect(q.quadrants.bottomRight?.points).toHaveLength(0);
    });

    it("re-adding an existing id replaces instead of duplicating", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10, "p-1"));
      q.addPoint(new Point(20, 20, "p-2"));
      q.addPoint(new Point(600, 400, "p-3"));

      q.addPoint(new Point(300, 300, "p-1"));

      const copies = q.query(area).filter((p) => p.id === "p-1");
      expect(copies).toHaveLength(1);
      expect(copies[0].x).toBe(300);
      expect(q.remove("p-1")).toBe(true);
      expect(q.query(area).some((p) => p.id === "p-1")).toBe(false);
    });

    it("re-adding an existing bounds id replaces instead of duplicating", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10, "p-1"));
      q.addPoint(new Point(20, 20, "p-2"));
      q.addBounds("b-1", new Rectangle(400, 400, new Point(320, 240)));

      q.addBounds("b-1", new Rectangle(10, 10, new Point(600, 400)));

      expect(q.queryIds(area).filter((id) => id === "b-1")).toHaveLength(1);
      expect(q.queryIds(new Rectangle(20, 20, new Point(320, 240)))).not.toContain("b-1");
      expect(q.queryIds(new Rectangle(20, 20, new Point(600, 400)))).toContain("b-1");
    });

    it("addPoint outside the area leaves an existing id untouched", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10, "p-1"));
      q.addPoint(new Point(20, 20, "p-2"));
      q.addPoint(new Point(600, 400, "p-3"));

      expect(q.addPoint(new Point(9999, 9999, "p-1"))).toBe(false);
      expect(q.query(area).filter((p) => p.id === "p-1")).toHaveLength(1);
    });

    it("remove finds a Point that was mutated in place", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      const point = new Point(10, 10, "p-1");
      q.addPoint(point);
      q.addPoint(new Point(20, 20, "p-2"));
      q.addPoint(new Point(600, 400, "p-3"));

      point.x = 600;
      point.y = 400;

      expect(q.remove("p-1")).toBe(true);
      expect(q.query(area).some((p) => p.id === "p-1")).toBe(false);
    });

    it("updatePoint with a Point mutated in place does not duplicate it", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      const point = new Point(10, 10, "p-1");
      q.addPoint(point);
      q.addPoint(new Point(20, 20, "p-2"));
      q.addPoint(new Point(600, 400, "p-3"));

      point.x = 600;
      point.y = 400;
      expect(q.updatePoint("p-1", point)).toBe(true);

      const copies = q.query(area).filter((p) => p.id === "p-1");
      expect(copies).toHaveLength(1);
      expect(copies[0].x).toBe(600);
      expect(q.query(new Rectangle(40, 40, new Point(10, 10))).some((p) => p.id === "p-1")).toBe(false);
    });

    it("a rejected update leaves the entity at its previous position", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10, "p-1"));
      q.addPoint(new Point(20, 20, "p-2"));
      q.addPoint(new Point(600, 400, "p-3"));

      expect(q.updatePoint("p-1", new Point(9999, 9999, "p-1"))).toBe(false);

      const copies = q.query(area).filter((p) => p.id === "p-1");
      expect(copies).toHaveLength(1);
      expect(copies[0].x).toBe(10);
      expect(q.remove("p-1")).toBe(true);
    });

    it("updateBounds moves an item out of the quadrants it no longer touches", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10, "p-1"));
      q.addPoint(new Point(20, 20, "p-2"));
      q.addBounds("b-1", new Rectangle(400, 400, new Point(320, 240)));

      expect(q.updateBounds("b-1", new Rectangle(10, 10, new Point(600, 400)))).toBe(true);

      expect(q.queryIds(area).filter((id) => id === "b-1")).toHaveLength(1);
      expect(q.queryIds(new Rectangle(20, 20, new Point(20, 20)))).not.toContain("b-1");
      expect(q.queryIds(new Rectangle(20, 20, new Point(600, 400)))).toContain("b-1");
    });

    it("remove finds bounds whose Rectangle was mutated in place", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);

      q.addPoint(new Point(10, 10, "p-1"));
      q.addPoint(new Point(20, 20, "p-2"));
      const bounds = new Rectangle(20, 20, new Point(100, 100));
      q.addBounds("b-1", bounds);

      bounds.moveCenterTo(600, 400);

      expect(q.remove("b-1")).toBe(true);
      expect(q.queryIds(area)).not.toContain("b-1");
    });

    it("remove deletes the bounds completely", () => {
      const area = new Rectangle(640, 480, new Point(640 / 2, 480 / 2));
      const q = new QuadTree(area, 3, 2);
      
      q.addPoint(new Point(10, 10, "p-1"));
      q.addPoint(new Point(10, 20, "p-2"));
      
      const largeBounds = new Rectangle(400, 400, new Point(320, 240));
      q.addBounds("bg-1", largeBounds);
      
      const removed = q.remove("bg-1");
      expect(removed).toBe(true);
      
      const ids = q.queryIds(area);
      expect(ids).toHaveLength(2);
      expect(ids).not.toContain("bg-1");
    });
  });
});
