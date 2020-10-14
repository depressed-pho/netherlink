import { Chunk } from 'netherlink/chunk';
import { Point } from 'netherlink/point';

export class Dimension {
    public get name(): string {
        throw new Error("Not implemented");
    }

    public toString(): string {
        return this.name;
    }

    /** Get the opposite dimension for a Nether portal, or throw if no
     * such dimension exists. */
    public get portalOpposite(): Dimension {
        throw new Error("Not implemented");
    }

    /** Calculate the nominal coordinates for the "opposite" side of a
     * Nether portal. The point is assumed to be integral.
     */
    public scaleForPortal(from: Point): Point {
        throw new Error("Not implemented");
    }

    /** Calculate the bounding area for searching Nether portals in
     * this dimension, based on the nominal destination. The area is
     * represented as [p1, p2).
     */
    public portalSearchArea(nominal: Point): [Point, Point] {
        throw new Error("Not implemented");
    }
};

export class Overworld extends Dimension {
    public get name(): string {
        return "Overworld";
    }

    public get portalOpposite(): Nether {
        return nether;
    }

    public scaleForPortal(from: Point): Point {
        return new Point(
            Math.floor(from.x / 8),
            from.y,
            Math.floor(from.z / 8));
    }

    public portalSearchArea(nominal: Point): [Point, Point] {
        const center = new Chunk(nominal);
        const min    = center.offset(-8, -8); // 17x17 chunks
        const max    = center.offset( 8,  8);
        return [
            new Point(min.origin.x     ,   0, min.origin.z     ),
            new Point(max.origin.x + 16, 256, max.origin.z + 16)
        ];
    }
};

export class Nether extends Dimension {
    public get name(): string {
        return "Nether";
    }

    public get portalOpposite(): Overworld {
        return overworld;
    }

    public scaleForPortal(from: Point): Point {
        return new Point(
            from.x * 8,
            from.y,
            from.z * 8);
    }

    public portalSearchArea(nominal: Point): [Point, Point] {
        const center = new Chunk(nominal);
        const min    = center.offset(-1, -1); // 3x3 chunks
        const max    = center.offset( 1,  1);
        return [
            new Point(min.origin.x     ,   0, min.origin.z     ),
            new Point(max.origin.x + 16, 128, max.origin.z + 16)
        ];
    }
};

export const overworld = new Overworld();
export const nether    = new Nether();
