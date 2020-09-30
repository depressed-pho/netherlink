import { World, WorldID } from 'netherlink/world';

/** An interface for saving world files in a browser (or somewhere
 * else). The backend can be, for example, Local Storage, IndexedDB,
 * or even cookies (ugh).
 */
export interface NLStorage extends Iterable<[WorldID, World]> {

    /** Storages aren't always available. For example, the local
     * storage might be disabled by a browser config. For this reason,
     * they may actually be non-working, but they have to indicate
     * that through this property. */
    readonly isAvailable: boolean;

    /** We hate it when our storage contains absolutely no world
     * files. There always has to be one world that is selected.
     */
    currentWorld: World;
}
