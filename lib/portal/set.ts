import { Dimension } from 'netherlink/dimension';
import { Point } from 'netherlink/point';
import { Portal } from 'netherlink/portal';
import pbRoot from '../world.proto';

export class PortalSet<D extends Dimension> implements Iterable<Portal<D>> {
    private readonly map: Map<string, Portal<D>>; // toString() of location as a key

    public constructor() {
        this.map = new Map<string, Portal<D>>();
    }

    public static from<D extends Dimension>(it: Iterable<Portal<D>>): PortalSet<D>;
    public static from<D extends Dimension, T>(it: Iterable<T>, f: (x: T) => Portal<D>): PortalSet<D>;
    public static from<D extends Dimension>(it: any, f?: any): PortalSet<D> {
        const s = new PortalSet<D>();
        if (f) {
            for (const x of it) {
                s.add(f(x));
            }
        }
        else {
            for (const x of it) {
                s.add(x);
            }
        }
        return s;
    }

    public clone(): PortalSet<D> {
        return PortalSet.from<D, Portal<D>>(this, p => p.clone());
    }

    public get size(): number {
        return this.map.size;
    }

    public [Symbol.iterator](): Iterator<Portal<D>> {
        return this.map.values();
    }

    /** Add a new portal to the portal set. If there is already a
     * portal at the same coords, the existing one will be replaced.
     */
    public add(portal: Portal<D>): this {
        this.map.set(portal.location.toString(), portal);
        return this;
    }

    public delete(portal: Portal<D>): this {
        this.map.delete(portal.location.toString());
        return this;
    }

    public clear(): this {
        this.map.clear();
        return this;
    }

    public find(loc: Point): Portal<D>|null {
        for (let p of this) {
            if (p.location.equals(loc)) {
                return p;
            }
        }
        return null;
    }

    /** Create a new PortalSet only containing portals within the
     * given area.
     */
    public narrow(area: [Point, Point]): PortalSet<D> {
        const ret = new PortalSet<D>();
        for (let p of this) {
            if (p.location.within(area)) {
                ret.add(p);
            }
        }
        return ret;
    }

    public static toMessage<D extends Dimension>(s: PortalSet<D>): any {
        return pbRoot.netherlink.PortalSet.create({
            portals: Array.from(s, p => Portal.toMessage(p))
        });
    }

    public static fromMessage<D extends Dimension>(m: any): PortalSet<D> {
        return PortalSet.from<D, any>(m.portals, mp => Portal.fromMessage<D>(mp));
    }
}
