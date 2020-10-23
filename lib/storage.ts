import { Dimension } from 'netherlink/dimension';
import { World, WorldID } from 'netherlink/world';

/** An interface for saving world files in a browser (or somewhere
 * else). The backend can be, for example, Local Storage, IndexedDB,
 * or even cookies (ugh).
 */
export interface NLStorage extends Iterable<World> {

    /** Storages aren't always available. For example, the local
     * storage might be disabled by a browser config. For this reason,
     * they may actually be non-working, but they have to indicate
     * that through this property.
     *
     * If the storage is unavailable, any attempts to write to it will
     * be silently ignored. But if it's available but its quota is
     * being exceeded, they will throw an error.
     */
    readonly isAvailable: boolean;

    /** We hate it when our storage contains absolutely no world
     * files. There always has to be one world that is selected. Note
     * that setting this property will also store the world.
     */
    activeWorld: World;

    /** When a new world is to be created, a good candidate for the
     * new world should be given to user. We don't really care if two
     * worlds have the same name, but it should be best avoided not to
     * confuse users.
     */
    newWorldNameCandidate: string;

    /** Load a world. If no corresponding worlds are stored, it will
     * raise an error.
     */
    loadWorld(id: WorldID): World;

    /** Store a world. It can either be a new world, or an existing
     * one.
     */
    storeWorld(w: World): void;

    /** Delete a world from the storage. If no corresponding worlds
     * are stored, it will do nothing. The world to be deleted must be
     * an inactive one, or otherwise it raises an error.
     */
    deleteWorld(id: WorldID): void;

    /** Scale of atlases from 0.5x to 8x, defaulted to 1.5x.
     */
    atlasScale<D extends Dimension>(dimension: D): number;
    atlasScale<D extends Dimension>(dimension: D, scale: number): void;
}
