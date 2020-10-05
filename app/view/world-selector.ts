import { World, WorldID } from 'netherlink/world';
import { WorldSelectorModel } from '../model/world-selector';
import { ModalAddWorldView } from './world-selector/add';

export class WorldSelectorView {
    private readonly model: WorldSelectorModel;

    private readonly selWorld: HTMLSelectElement;

    private readonly btnAdd: HTMLButtonElement;
    private readonly modalAdd: ModalAddWorldView;

    public constructor(model: WorldSelectorModel) {
        this.model = model;

        /* The world selector control is synchronized with the world
         * list property. */
        this.selWorld = document.getElementById("selWorld")! as HTMLSelectElement;
        model.worlds.onValue(s => this.refreshList(s));

        /* The "Add..." button is always enabled and will open a modal
         * window when clicked. */
        this.btnAdd   = document.getElementById("btnAddWorld")! as HTMLButtonElement;
        this.modalAdd = new ModalAddWorldView(model);
        this.btnAdd.addEventListener("click", ev => this.modalAdd.open());
    }

    private refreshList(set: Set<World>): void {
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
        }
    }
}
