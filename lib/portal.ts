import { Dimension } from 'netherlink/dimension';
import { Point } from 'netherlink/point';
import { World } from 'netherlink/world';
import Color = require('color');

export class Portal<D extends Dimension> {
    private readonly dimension: D;
    public readonly location: Point;
    public name: string;
    public color: Color;

    public constructor(dimension: D, location: Point, name: string, color: Color) {
        /* We really want to do something like "this.dimension =
         * D.singleton", but sadly types in TypeScript is not
         * available at runtime. */
        this.dimension = dimension;
        this.location  = location;
        this.name      = name;
        this.color     = color;
    }

    public linkedPortal<D1 extends Dimension>(w: World): Portal<D1>|null {
        // FIXME: not implemented
        return null;
    }

    public equals(that: Portal<D>): boolean {
        return this.location.equals(that.location);
    }

    public static equals<D extends Dimension>(a: Portal<D>, b: Portal<D>): boolean {
        return a.equals(b);
    }

    /** Compare two portals by their location. */
    public static compare<D extends Dimension>(p1: Portal<D>, p2: Portal<D>): -1|0|1 {
        /* Since there is no sensible way to order 3D points, we
         * compare their distance from the origin. */
        const d1 = Point.distance(p1.location, Point.origin);
        const d2 = Point.distance(p2.location, Point.origin);
        return d1 < d2 ? -1
            :  d1 > d2 ?  1
            :  0;
    }
}
