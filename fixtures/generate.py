#!/usr/bin/env python3
"""Regenerate the neutral geometry fixtures used by the test suite.

- layout.stl   binary STL: two boxes (5.4 x 12.6 x 12.3 each) with a 6.4 mm
               gap, mirroring a typical two-part print plate.
- box-ascii.stl ASCII STL: one 4 x 10 x 6 box (covers the ASCII parser and
               the offset-80 binary/facet-count sniffing regression).

Run from the repo root:  python3 fixtures/generate.py
"""
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parent


def box(min_pt, max_pt):
    """Return 12 outward-wound triangles of an axis-aligned box."""
    x0, y0, z0 = min_pt
    x1, y1, z1 = max_pt
    v = {
        "a": (x0, y0, z0), "b": (x1, y0, z0), "c": (x1, y1, z0), "d": (x0, y1, z0),
        "e": (x0, y0, z1), "f": (x1, y0, z1), "g": (x1, y1, z1), "h": (x0, y1, z1),
    }
    return [
        # bottom (-z)
        (v["a"], v["c"], v["b"]), (v["a"], v["d"], v["c"]),
        # top (+z)
        (v["e"], v["f"], v["g"]), (v["e"], v["g"], v["h"]),
        # front (-y)
        (v["a"], v["b"], v["f"]), (v["a"], v["f"], v["e"]),
        # back (+y)
        (v["d"], v["g"], v["c"]), (v["d"], v["h"], v["g"]),
        # left (-x)
        (v["a"], v["e"], v["h"]), (v["a"], v["h"], v["d"]),
        # right (+x)
        (v["b"], v["c"], v["g"]), (v["b"], v["g"], v["f"]),
    ]


def normal(tri):
    (ax, ay, az), (bx, by, bz), (cx, cy, cz) = tri
    ux, uy, uz = bx - ax, by - ay, bz - az
    vx, vy, vz = cx - ax, cy - ay, cz - az
    nx, ny, nz = uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx
    length = (nx * nx + ny * ny + nz * nz) ** 0.5 or 1.0
    return nx / length, ny / length, nz / length


def write_binary_stl(path, tris):
    with open(path, "wb") as f:
        f.write(b"neutral test fixture".ljust(80, b"\0"))
        f.write(struct.pack("<I", len(tris)))
        for tri in tris:
            f.write(struct.pack("<3f", *normal(tri)))
            for vert in tri:
                f.write(struct.pack("<3f", *vert))
            f.write(struct.pack("<H", 0))


def write_ascii_stl(path, tris):
    with open(path, "w") as f:
        f.write("solid neutral-box\n")
        for tri in tris:
            f.write(f"  facet normal {normal(tri)[0]:.6f} {normal(tri)[1]:.6f} {normal(tri)[2]:.6f}\n")
            f.write("    outer loop\n")
            for x, y, z in tri:
                f.write(f"      vertex {x:.6f} {y:.6f} {z:.6f}\n")
            f.write("    endloop\n  endfacet\n")
        f.write("endsolid neutral-box\n")


def main():
    h, w, d = 12.3, 5.4, 12.6  # z height, x width, y depth
    gap = 6.4
    tris = [
        *box((3.2, 0.0, 0.0), (3.2 + w, d, h)),
        *box((-3.2 - w, 0.0, 0.0), (-3.2, d, h)),
    ]
    assert len(tris) == 24
    write_binary_stl(OUT / "layout.stl", tris)
    write_ascii_stl(OUT / "box-ascii.stl", box((0, 0, 0), (4, 10, 6)))
    print("fixtures written:", OUT / "layout.stl", "and", OUT / "box-ascii.stl")


if __name__ == "__main__":
    main()
