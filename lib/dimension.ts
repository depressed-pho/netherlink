import pbRoot from './world.proto';
import { Chunk } from 'netherlink/chunk';
import { Point } from 'netherlink/point';

export abstract class Dimension {
    public abstract get name(): string;
    public abstract get minAltitude(): number;
    public abstract get maxAltitude(): number;

    public toString(): string {
        return this.name;
    }

    /** Get the opposite dimension for a Nether portal, or throw if no
     * such dimension exists. */
    public abstract get portalOpposite(): Dimension;

    /** Calculate the nominal coordinates for the "opposite" side of a
     * Nether portal. The point is assumed to be integral.
     */
    public abstract scaleForPortal(from: Point): Point;

    /** Like scaleForPortal() but this one also applies a restriction
     * for creating new portals.
     */
    public scaleAndRestrictForPortal(from: Point): Point {
        const scaled = this.scaleForPortal(from);
        const minY   = 70;
        const maxY   = this.portalOpposite.maxAltitude - 10;
        return new Point(
            scaled.x,
            Math.min(Math.max(scaled.y, minY), maxY),
            scaled.z);
    }

    /** Calculate the bounding area for searching Nether portals in
     * this dimension, based on the nominal destination. The area is
     * represented as [p1, p2).
     */
    public abstract portalSearchArea(nominal: Point): [Point, Point];

    public static toMessage(d: Dimension): number {
        /* This is very suboptimal, but what else can we do? */
        if (d instanceof Overworld) {
            return pbRoot.netherlink.Dimension.OVERWORLD;
        }
        else if (d instanceof Nether) {
            return pbRoot.netherlink.Dimension.NETHER;
        }
        else {
            throw new Error(`Unsupported dimension: ${d}`);
        }
    }

    public static fromMessage<D extends Dimension>(m: number): D {
        /* Again, this is fucking suboptimal. */
        switch (m) {
            case pbRoot.netherlink.Dimension.OVERWORLD:
                return overworld as any;

            case pbRoot.netherlink.Dimension.NETHER:
                return nether as any;

            default:
                throw new Error(`Unknown dimension: ${m}`);
        }
    }
};

export class Overworld extends Dimension {
    public get name(): string {
        return "Overworld";
    }

    public override get minAltitude(): number {
        return -64;
    }

    public override get maxAltitude(): number {
        return 320;
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

    public override get minAltitude(): number {
        return 0;
    }

    public override get maxAltitude(): number {
        return 128;
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
