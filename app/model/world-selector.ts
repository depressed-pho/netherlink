import * as Bacon from 'baconjs';
import { NLStorage } from 'netherlink/storage';
import { World, WorldID } from 'netherlink/world';

export class WorldSelectorModel {
    private readonly storage: NLStorage;

    /* Events indicating the world list needs to be refreshed. */
    private readonly worldsBus: Bacon.Bus<Set<World>>;
    public readonly worlds: Bacon.Property<Set<World>>;

    public constructor(storage: NLStorage) {
        this.storage = storage;

        this.worldsBus = new Bacon.Bus<Set<World>>();
        this.worlds    = this.worldsBus.toProperty(new Set<World>(storage));
    }

    public get newWorldNameCandidate(): string {
        return this.storage.newWorldNameCandidate;
    }
}
