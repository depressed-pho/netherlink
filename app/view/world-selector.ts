import { World, WorldID } from 'netherlink/world';
import { WorldSelectorModel } from '../model/world-selector';

export class WorldSelectorView {
    private readonly selectElem: HTMLSelectElement;

    public constructor(model: WorldSelectorModel) {
        this.selectElem = document.getElementById("world-selector")! as HTMLSelectElement;

        /* The world selector control is synchronized with the world
         * list property. */
        model.worlds.onValue(m => this.refreshList(m));
    }

    private refreshList(map: Map<WorldID, World>): void {
        /* The map is of course unordered but we want the list to be
         * sorted by creation time. The world ID is UUID v1 so we can
         * just sort them by ID. */
        const worlds = Array.from(map).sort(
            ([id1, ], [id2, ]) => id1 < id2 ? -1 : id1 > id2 ? 1 : 0);

        while (this.selectElem.firstElementChild) {
            this.selectElem.firstElementChild.remove();
        }
        for (const [id, world] of worlds) {
            const opt = document.createElement("option");
            opt.value = id;
            opt.text  = world.name;
            this.selectElem.add(opt);
        }
    }
}
