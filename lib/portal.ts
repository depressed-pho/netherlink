import Color = require('color');
import { Dimension } from 'netherlink/dimension';
import { Point } from 'netherlink/point';
import { World } from 'netherlink/world';
import pbRoot from './world.proto';

export class Portal<D extends Dimension> {
    public readonly dimension: D;
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

    public clone(): Portal<D> {
        return new Portal<D>(this.dimension, this.location, this.name, this.color);
    }

    public linkedPortal<D1 extends Dimension>(w: World): Portal<D1>|null {
        /* First, calculate the coords of the nominal destination. X
         * and Z are multiplied or divided by 8, and Y remains
         * unchanged. */
        const nominal: Point = this.dimension.scaleForPortal(this.location);

        /* Then search for destination candidates based on chunks. The
         * bounding area is 17x17 chunks in the Overworld and 3x3
         * chunks in the Nether centered on the chunk containing the
         * nominal destination. */
        const oppositeD  = this.dimension.portalOpposite;
        const allPortals = w.portals(oppositeD);
        const candidates = allPortals.narrow(oppositeD.portalSearchArea(nominal));

        /* Then find the portal closest to the nominal
         * destination. What if there are two portals with exactly the
         * same distance? Meh, that's an implementation detail and we
         * can do nothing about that.
         */
        let closestP:  Portal<D1>|null = null;
        let shortestD: number    |null = null;
        for (let p of candidates) {
            const d = Point.distance(p.location, nominal);
            if (shortestD == null || shortestD > d) {
                /* Found a closer one. */
                closestP  = p as any;
                shortestD = d;
            }
        }

        return closestP;
    }

    public searchArea(): [Point, Point] {
        const nominal: Point = this.dimension.scaleForPortal(this.location);
        return this.dimension.portalOpposite.portalSearchArea(nominal);
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
            :  /* But if they both have the same distance from the
                * origin, we order them by x, y, and z coordinates
                * accordingly. This works because two distinct portals
                * cannot be placed at the same spot. */
               p1.location.x < p2.location.x ? -1
            :  p1.location.x > p2.location.x ?  1
            :  p1.location.y < p2.location.y ? -1
            :  p1.location.y > p2.location.y ?  1
            :  p1.location.z < p2.location.z ? -1
            :  p1.location.z > p2.location.z ?  1
            :  0;
    }

    public static toMessage<D extends Dimension>(p: Portal<D>): any {
        return pbRoot.netherlink.Portal.create({
            dimension: Dimension.toMessage(p.dimension),
            location:  Point.toMessage(p.location),
            name:      p.name,
            color:     (() => {
                const rgb = p.color.rgb();
                return pbRoot.netherlink.Color.create({
                    r: rgb.red(),
                    g: rgb.green(),
                    b: rgb.blue()
                })
            })()
        });
    }

    public static fromMessage<D extends Dimension>(m: any): Portal<D> {
        return new Portal<D>(
            Dimension.fromMessage(m.dimension),
            Point.fromMessage(m.location),
            m.name,
            new Color({
                r: m.color.r,
                g: m.color.g,
                b: m.color.b
            }));
    }
}
