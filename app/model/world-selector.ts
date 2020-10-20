import * as Bacon from 'baconjs';
import { Dimension, Overworld, Nether, overworld, nether } from 'netherlink/dimension';
import { NLStorage } from 'netherlink/storage';
import { World, WorldID } from 'netherlink/world';

export class WorldSelectorModel {
    private readonly storage: NLStorage;

    /* Events indicating the world list needs to be refreshed. */
    private readonly worldsBus: Bacon.Bus<Set<World>>;
    public readonly worlds: Bacon.Property<Set<World>>;

    /* Events indicating the active world has been changed. */
    private readonly activeWorldBus: Bacon.Bus<World>;
    public readonly activeWorld: Bacon.Property<World>;

    /* Events indicating atlas scales have been changed. */
    private readonly overworldAtlasScaleBus: Bacon.Bus<number>;
    public readonly overworldAtlasScale: Bacon.Property<number>;
    private readonly netherAtlasScaleBus: Bacon.Bus<number>;
    public readonly netherAtlasScale: Bacon.Property<number>;

    public constructor(storage: NLStorage) {
        this.storage = storage;

        this.worldsBus = new Bacon.Bus<Set<World>>();
        this.worlds    = this.worldsBus.toProperty(new Set<World>(storage));

        this.activeWorldBus = new Bacon.Bus<World>();
        this.activeWorld    = this.activeWorldBus.toProperty(storage.activeWorld);

        this.overworldAtlasScaleBus = new Bacon.Bus<number>();
        this.overworldAtlasScale    = this.overworldAtlasScaleBus.toProperty(storage.atlasScale(overworld));

        this.netherAtlasScaleBus = new Bacon.Bus<number>();
        this.netherAtlasScale    = this.netherAtlasScaleBus.toProperty(storage.atlasScale(nether));
    }

    public get newWorldNameCandidate(): string {
        return this.storage.newWorldNameCandidate;
    }

    public newWorld(name: string): World {
        const w = new World(name);

        this.storage.storeWorld(w);
        this.worldsBus.push(new Set<World>(this.storage));

        return w;
    }

    public activateWorld(id: WorldID): void;
    public activateWorld(w: World): void;
    public activateWorld(x: any): void {
        let w: World;

        if (typeof x === "string") {
            w = this.storage.loadWorld(x);
        }
        else if (x instanceof World) {
            w = x;
        }
        else {
            throw new Error('never reach here');
        }

        this.storage.activeWorld = w;
        this.activeWorldBus.push(w);
    }

    public modifyActiveWorld(mod: (w: World) => void): void {
        const w: World = this.storage.activeWorld;
        mod(w);
        this.storage.storeWorld(w);
        this.activeWorldBus.push(w);
    }

    public deleteWorld(id: WorldID): void {
        this.storage.deleteWorld(id);
        this.worldsBus.push(new Set<World>(this.storage));
    }

    public atlasScale<D extends Dimension>(dimension: D): Bacon.Property<number>;
    public atlasScale<D extends Dimension>(dimension: D, scale: number): void;
    public atlasScale<D extends Dimension>(dimension: D, scale?: number): any {
        if (scale) {
            this.storage.atlasScale(dimension, scale);
            this.atlasScaleBus(dimension).push(scale);
        }
        else {
            if (dimension instanceof Overworld) {
                return this.overworldAtlasScale as any;
            }
            else if (dimension instanceof Nether) {
                return this.netherAtlasScale as any;
            }
            else {
                throw new Error(`Unsupported dimension: ${dimension}`);
            }
        }
    }

    private atlasScaleBus<D extends Dimension>(dimension: D): Bacon.Bus<number> {
        if (dimension instanceof Overworld) {
            return this.overworldAtlasScaleBus as any;
        }
        else if (dimension instanceof Nether) {
            return this.netherAtlasScaleBus as any;
        }
        else {
            throw new Error(`Unsupported dimension: ${dimension}`);
        }
    }
}
