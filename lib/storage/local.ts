import * as base64 from 'js-base64';
import * as pako from 'pako';
import pbRoot from '../world.proto';
import { Dimension } from 'netherlink/dimension';
import { NLStorage } from 'netherlink/storage';
import { World, WorldID } from 'netherlink/world';

/** The local storage is a scarce resource. We compress world save
 * files in gzip (not deflate, because we also want a checksum), and
 * store data with the following keys:
 *
 * - "netherlink/worlds": Base64-encoded gzip-compressed Worlds
 */
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
        this.loadWorlds();

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
        this.storeWorld(w);
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

    public storeWorld(w: World): void {
        this.worlds.set(w.id, w);
        this.saveWorlds();
    }

    public deleteWorld(id: WorldID): void {
        if (this._activeWorld == id) {
            throw new Error(`World ${id} is currently active`);
        }

        this.worlds.delete(id);
        this.saveWorlds();
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

    private saveWorlds(): void {
        if (this.backend) {
            const worlds = pbRoot.netherlink.Worlds.create({
                worlds: Array.from(this, w => World.toMessage(w))
            });

            const invalid = pbRoot.netherlink.Worlds.verify(worlds);
            if (invalid) {
                // Should not happen unless our code is broken.
                throw new Error(invalid);
            }

            const raw     = pbRoot.netherlink.Worlds.encode(worlds).finish();
            const gzipped = pako.gzip(raw);
            const b64     = base64.fromUint8Array(gzipped);

            this.backend.setItem("netherlink/worlds", b64);
        }
    }

    /** We must not throw errors even if the storage is corrupted,
     * because then the app cannot even boot.
     */
    private loadWorlds(): void {
        this.worlds.clear();

        if (this.backend) {
            const b64 = this.backend.getItem("netherlink/worlds");
            if (b64) {
                try {
                    const gzipped = base64.toUint8Array(b64);
                    const raw     = pako.ungzip(gzipped);
                    const worlds  = pbRoot.netherlink.Worlds.decode(raw);

                    for (const mw of worlds.worlds) {
                        const w = World.fromMessage(mw);
                        this.worlds.set(w.id, w);
                    }
                }
                catch (e) {
                    console.log("An error occured while loading worlds from the local storage: ", e);
                }
            }
        }
    }
}

export const instance: LocalStorage = new LocalStorage();
