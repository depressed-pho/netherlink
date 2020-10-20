import * as Bacon from 'baconjs';
import { Dimension, Overworld, Nether, overworld, nether } from 'netherlink/dimension';
import { Point } from 'netherlink/point';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
import { WorldSelectorModel } from './world-selector';

export class WorldEditorModel {
    private readonly selModel: WorldSelectorModel;

    public readonly world: Bacon.Property<World>;

    private readonly portalsInOverworld: Bacon.Property<Set<Portal<Overworld>>>;
    private readonly portalsInNether: Bacon.Property<Set<Portal<Nether>>>;

    private readonly selectedPortalInOverworldBus: Bacon.Bus<Portal<Overworld>|null>;
    private readonly selectedPortalInOverworld: Bacon.Property<Portal<Overworld>|null>;

    private readonly selectedPortalInNetherBus: Bacon.Bus<Portal<Nether>|null>;
    private readonly selectedPortalInNether: Bacon.Property<Portal<Nether>|null>;

    private readonly coordsInOverworldBus: Bacon.Bus<Point>;
    private readonly coordsInOverworld: Bacon.Property<Point>;

    private readonly coordsInNetherBus: Bacon.Bus<Point>;
    private readonly coordsInNether: Bacon.Property<Point>;

    public constructor(selModel: WorldSelectorModel) {
        this.selModel = selModel;

        this.world = this.selModel.activeWorld;

        this.portalsInOverworld = this.world.map(w => {
            return new Set<Portal<Overworld>>(w.portals(overworld));
        });
        this.portalsInNether = this.world.map(w => {
            return new Set<Portal<Nether>>(w.portals(nether));
        });

        this.selectedPortalInOverworldBus = new Bacon.Bus<Portal<Overworld>|null>();
        this.selectedPortalInOverworld    =
            this.selectedPortalInOverworldBus
                .skipDuplicates((a, b) =>  a &&  b ? a.equals(b)
                                        : !a && !b ? true
                                        : false)
                .toProperty(null);

        this.selectedPortalInNetherBus = new Bacon.Bus<Portal<Nether>|null>();
        this.selectedPortalInNether    =
            this.selectedPortalInNetherBus
                .skipDuplicates((a, b) =>  a &&  b ? a.equals(b)
                                        : !a && !b ? true
                                        : false)
                .toProperty(null);

        this.coordsInOverworldBus = new Bacon.Bus<Point>();
        this.coordsInOverworld    =
            this.coordsInOverworldBus
                .skipDuplicates(Point.equals)
                .toProperty(new Point(0, 64, 0));

        this.coordsInNetherBus    = new Bacon.Bus<Point>();
        this.coordsInNether       =
            this.coordsInNetherBus
                .skipDuplicates(Point.equals)
                .toProperty(new Point(0, 64, 0));

        /* This is a tricky part. Changes in the selected portal
         * property affects the current coords in the same dimension,
         * but changes in the current coords also affects the selected
         * portal in the same dimension. But since update events for
         * coords can happen very frequently, we throttle those
         * events. */
        this.coordsInOverworldBus.plug(
            this.selectedPortalInOverworld
                .flatMap(p => p ? Bacon.once(p.location) : Bacon.never() as any));
        this.coordsInNetherBus.plug(
            this.selectedPortalInNether
                .flatMap(p => p ? Bacon.once(p.location) : Bacon.never() as any));

        const throttleMilliSec  = 10;
        const throttledCoordsOW = this.coordsInOverworld.throttle(throttleMilliSec);
        const throttledCoordsNT = this.coordsInNether.throttle(throttleMilliSec);
        this.selectedPortalInOverworldBus.plug(
            Bacon.combineAsArray(
                throttledCoordsOW,
                this.world.sampledBy(throttledCoordsOW) as any)
                .map(([pt, w]: any) => w.portals(overworld).find(pt)));
        this.selectedPortalInNetherBus.plug(
            Bacon.combineAsArray(
                throttledCoordsNT,
                this.world.sampledBy(throttledCoordsNT) as any)
                .map(([pt, w]: any) => w.portals(nether).find(pt)));

        /* And this too is a tricky part. Whenever a portal is
         * selected, and has a linked portal in the opposite
         * dimension, the linked one will be selected too (and thus
         * changes the coords in the other dimension).
         */
        this.selectedPortalInOverworldBus.plug(
            Bacon.combineAsArray(
                this.selectedPortalInNether,
                this.world.sampledBy(this.selectedPortalInNether) as any)
                .flatMap(([p, w]: any) => {
                    if (p) {
                        const p2: Portal<Overworld>|null = p.linkedPortal(w);
                        return p2 ? Bacon.once(p2) : Bacon.never() as any;
                    }
                    else {
                        return Bacon.never();
                    }
                }));
        this.selectedPortalInNetherBus.plug(
            Bacon.combineAsArray(
                this.selectedPortalInOverworld,
                this.world.sampledBy(this.selectedPortalInOverworld) as any)
                .flatMap(([p, w]: any) => {
                    if (p) {
                        const p2: Portal<Nether>|null = p.linkedPortal(w);
                        return p2 ? Bacon.once(p2) : Bacon.never() as any;
                    }
                    else {
                        return Bacon.never();
                    }
                }));
    }

    /* Events indicating portal lists need to be refreshed. */
    public portals<D extends Dimension>(dimension: D): Bacon.Property<Set<Portal<D>>> {
        if (dimension instanceof Overworld) {
            /* Now we know D is Overworld but TypeScript doesn't allow
             * us to do this without a type coercion. Possibly a
             * bug? */
            return this.portalsInOverworld as any;
        }
        else if (dimension instanceof Nether) {
            return this.portalsInNether as any;
        }
        else {
            throw new Error(`Unsupported dimension: ${dimension}`);
        }
    }

    /* Events indicating a different portal has been selected. */
    public selectedPortal<D extends Dimension>(dimension: D): Bacon.Property<Portal<D>> {
        if (dimension instanceof Overworld) {
            /* Now we know D is Overworld but TypeScript doesn't allow
             * us to do this without coercing to any. Possibly a
             * bug? */
            return this.selectedPortalInOverworld as any;
        }
        else if (dimension instanceof Nether) {
            return this.selectedPortalInNether as any;
        }
        else {
            throw new Error(`Unsupported dimension: ${dimension}`);
        }
    }

    private selectedPortalBus<D extends Dimension>(dimension: D): Bacon.Bus<Portal<D>|null> {
        if (dimension instanceof Overworld) {
            return this.selectedPortalInOverworldBus as any;
        }
        else if (dimension instanceof Nether) {
            return this.selectedPortalInNetherBus as any;
        }
        else {
            throw new Error(`Unsupported dimension: ${dimension}`);
        }
    }

    public selectPortal<D extends Dimension>(dimension: D, portal: Portal<D>|null) {
        this.selectedPortalBus(dimension).push(portal);
    }

    /** Add a new portal to the world. If there is already a portal at
     * the same coords in the same dimension, the existing one will be
     * replaced.
     */
    public addPortal<D extends Dimension>(portal: Portal<D>) {
        this.selModel.modifyActiveWorld((w: World) => {
            w.portals(portal.dimension).add(portal);
        });
        this.selectedPortalBus(portal.dimension).push(portal);
    }

    public deletePortal<D extends Dimension>(portal: Portal<D>) {
        this.selectedPortalBus(portal.dimension).push(null);
        this.selModel.modifyActiveWorld((w: World) => {
            w.portals(portal.dimension).delete(portal);
        });
    }

    public currentCoords<D extends Dimension>(dimension: D): Bacon.Property<Point>;
    public currentCoords<D extends Dimension>(dimension: D, pt: Point): void;
    public currentCoords<D extends Dimension>(dimension: D, pt?: Point): any {
        if (pt) {
            this.currentCoordsBus(dimension).push(pt);
        }
        else {
            if (dimension instanceof Overworld) {
                return this.coordsInOverworld as any;
            }
            else if (dimension instanceof Nether) {
                return this.coordsInNether as any;
            }
            else {
                throw new Error(`Unsupported dimension: ${dimension}`);
            }
        }
    }

    private currentCoordsBus<D extends Dimension>(dimension: D): Bacon.Bus<Point> {
        if (dimension instanceof Overworld) {
            return this.coordsInOverworldBus as any;
        }
        else if (dimension instanceof Nether) {
            return this.coordsInNetherBus as any;
        }
        else {
            throw new Error(`Unsupported dimension: ${dimension}`);
        }
    }
}
