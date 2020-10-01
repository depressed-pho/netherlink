import { World, WorldID } from 'netherlink/world';
import { WorldSelectorModel } from '../model/world-selector';

export class WorldSelectorView {
    private readonly selectElem: HTMLSelectElement;

    public constructor(model: WorldSelectorModel) {
        this.selectElem = document.getElementById("world-selector")! as HTMLSelectElement;

        /* The world selector control is synchronized with the world
         * list property. */
        model.worlds.onValue(s => this.refreshList(s));
    }

    private refreshList(set: Set<World>): void {
        /* The set is of course unordered but we want the list to be
         * sorted by creation time. The world ID is UUID v1 so we can
         * sort them by their time stamp. */
        const worlds = Array.from(set).sort(
            (w1, w2) => World.compare(w1, w2));

        while (this.selectElem.firstElementChild) {
            this.selectElem.firstElementChild.remove();
        }
        for (const world of worlds) {
            const opt = document.createElement("option");
            opt.value = world.id;
            opt.text  = world.name;
            this.selectElem.add(opt);
        }
    }
}
