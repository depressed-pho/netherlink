import { World, WorldID } from 'netherlink/world';

/** An interface for saving world files in a browser (or somewhere
 * else). The backend can be, for example, Local Storage, IndexedDB,
 * or even cookies (ugh).
 */
export interface NLStorage extends Iterable<World> {

    /** Storages aren't always available. For example, the local
     * storage might be disabled by a browser config. For this reason,
     * they may actually be non-working, but they have to indicate
     * that through this property. */
    readonly isAvailable: boolean;

    /** We hate it when our storage contains absolutely no world
     * files. There always has to be one world that is selected.
     */
    currentWorld: World;

    /** When a new world is to be created, a good candidate for the
     * new world should be given to user. We don't really care if two
     * worlds have the same name, but it should be best avoided not to
     * confuse users.
     */
    newWorldNameCandidate: string;
}
