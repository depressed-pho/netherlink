import * as Bacon from 'baconjs';
import { World, WorldID } from 'netherlink/world';
import { WorldSelectorModel } from '../model/world-selector';
import { ModalNewWorldView } from './world-selector/new';

export class WorldSelectorView {
    private readonly model: WorldSelectorModel;

    private readonly selWorld: HTMLSelectElement;

    private readonly btnNew: HTMLButtonElement;
    private readonly modalNew: ModalNewWorldView;

    public constructor(model: WorldSelectorModel) {
        this.model = model;

        /* The world selector control is synchronized with the world
         * list and the active world property. */
        this.selWorld = document.getElementById("selWorld")! as HTMLSelectElement;
        Bacon.combineAsArray(model.worlds, model.activeWorld as any)
            .onValue(([set, active]: any) => this.refreshList(set, active));

        /* The "New..." button is always enabled and will open a modal
         * window when clicked. */
        this.btnNew   = document.getElementById("btnNewWorld")! as HTMLButtonElement;
        this.modalNew = new ModalNewWorldView(model);
        this.btnNew.addEventListener("click", ev => this.modalNew.open());
    }

    private refreshList(set: Set<World>, active: World): void {
        /* The set is of course unordered but we want the list to be
         * sorted by creation time. The world ID is UUID v1 so we can
         * sort them by their time stamp. */
        const worlds = Array.from(set).sort(
            (w1, w2) => World.compare(w1, w2));

        while (this.selWorld.firstElementChild) {
            this.selWorld.firstElementChild.remove();
        }
        for (const world of worlds) {
            const opt = document.createElement("option");
            opt.value = world.id;
            opt.text  = world.name;
            this.selWorld.add(opt);

            if (world.id == active.id) {
                this.selWorld.selectedIndex = this.selWorld.options.length - 1;
            }
        }
    }
}
