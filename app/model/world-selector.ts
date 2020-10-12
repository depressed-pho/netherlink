import * as Bacon from 'baconjs';
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

    public constructor(storage: NLStorage) {
        this.storage = storage;

        this.worldsBus = new Bacon.Bus<Set<World>>();
        this.worlds    = this.worldsBus.toProperty(new Set<World>(storage));

        this.activeWorldBus = new Bacon.Bus<World>();
        this.activeWorld = this.activeWorldBus.toProperty(storage.activeWorld);
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
        this.activeWorldBus.push(w);
    }

    public deleteWorld(id: WorldID): void {
        this.storage.deleteWorld(id);
        this.worldsBus.push(new Set<World>(this.storage));
    }
}
