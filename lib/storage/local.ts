import { Dimension } from 'netherlink/dimension';
import { NLStorage } from 'netherlink/storage';
import { World, WorldID } from 'netherlink/world';

export class LocalStorage implements NLStorage {
    private backend?: Storage;
    private worlds: Map<WorldID, World>;
    private _activeWorld: WorldID;
    private _atlasScale: Map<Dimension, number>;

    public constructor() {
        /* The local storage isn't always available. The browser may
         * be configured to not allow its use.
         */
        try {
            this.backend = window.localStorage;
        }
        catch (e) {
            console.log("Local storage is not available:", e);
        }

        this.worlds = new Map<WorldID, World>();
        // FIXME: Load the worlds.

        /* Storages must always be non-empty. */
        if (this.worlds.size == 0) {
            const w = new World(this.newWorldNameCandidate);

            this.worlds.set(w.id, w);
            this._activeWorld = w.id;
        }
        else {
            // FIXME: Load this.
            this._activeWorld = this.worlds.keys().next().value;
        }

        // FIXME: load this.
        this._atlasScale = new Map<Dimension, number>();
    }

    get isAvailable(): boolean {
        return !!this.backend;
    }

    get activeWorld(): World {
        return this.worlds.get(this._activeWorld)!;
    }

    set activeWorld(w: World) {
        // FIXME: save it
        this._activeWorld = w.id;
    }

    public [Symbol.iterator](): Iterator<World> {
        return this.worlds.values();
    }

    get newWorldNameCandidate(): string {
        const names = new Set<string>();
        for (let w of this) {
            names.add(w.name);
        }

        if (!names.has(`World #${this.worlds.size + 1}`)) {
            return `World #${this.worlds.size + 1}`;
        }

        for (let i = 1;; i++) {
            if (!names.has(`World #${i}`)) {
                return `World #${i}`;
            }
        }
        /* TypeScript detects that the function evaluation never
         * reaches here!? That's amazing! */
    }

    public loadWorld(id: WorldID): World {
        const w = this.worlds.get(id);
        if (w) {
            return w;
        }
        else {
            throw new Error(`World ${id} not found`);
        }
    }

    public storeWorld(w: World) {
        // FIXME: save it.
        this.worlds.set(w.id, w);
    }

    public deleteWorld(id: WorldID): void {
        if (this._activeWorld == id) {
            throw new Error(`World ${id} is currently active`);
        }

        // FIXME: delete it.
        this.worlds.delete(id);
    }

    public atlasScale<D extends Dimension>(dimension: D): number;
    public atlasScale<D extends Dimension>(dimension: D, scale: number): void;
    public atlasScale<D extends Dimension>(dimension: D, scale?: number): any {
        if (scale) {
            this._atlasScale.set(dimension, scale);
            // FIXME: save this.
        }
        else {
            const s = this._atlasScale.get(dimension);
            return s ? s : 1.5;
        }
    }
}

export const instance: LocalStorage = new LocalStorage();
