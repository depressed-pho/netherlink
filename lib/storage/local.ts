import { NLStorage } from 'netherlink/storage';
import { World, WorldID } from 'netherlink/world';

export class LocalStorage implements NLStorage {
    private backend?: Storage;
    private worlds: Map<WorldID, World>;
    private _currentWorld: WorldID;

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
            // THINKME: Should we really do this here...?
            const w = new World("World #1");

            this.worlds.set(w.id, w);
            this._currentWorld = w.id;
        }
        else {
            // FIXME: Load this.
            this._currentWorld = this.worlds.keys().next().value;
        }
    }

    get isAvailable(): boolean {
        return !!this.backend;
    }

    get currentWorld(): World {
        return this.worlds.get(this._currentWorld)!;
    }

    public [Symbol.iterator](): Iterator<World> {
        return this.worlds.values();
    }
}

export const instance: LocalStorage = new LocalStorage();
