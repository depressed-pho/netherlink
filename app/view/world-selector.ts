import * as Bacon from 'baconjs';
import { confirm } from './confirm';
import { World, WorldID } from 'netherlink/world';
import { WorldSelectorModel } from '../model/world-selector';
import { ModalNewWorldView } from './world-selector/new';

export class WorldSelectorView {
    private readonly model: WorldSelectorModel;

    private readonly selWorld: HTMLSelectElement;

    private readonly btnNew: HTMLButtonElement;
    private readonly modalNew: ModalNewWorldView;

    private readonly btnDelete: HTMLButtonElement;
    private readonly btnRename: HTMLButtonElement;

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

        /* The "Delete..." button is enabled when there are more than
         * one world, and will open a modal window when clicked. */
        this.btnDelete = document.getElementById("btnDeleteWorld")! as HTMLButtonElement;
        this.model.worlds.onValue(set => {
            this.btnDelete.disabled = set.size <= 1;
        });
        this.btnDelete.addEventListener("click", ev => this.onDeleteWorld());

        /* The "Rename..." button is always enabled and will open a
         * modal window when clicked. */
        this.btnRename = document.getElementById("btnRenameWorld")! as HTMLButtonElement;
        // FIXME: Handle it.
    }

    private refreshList(set: Set<World>, active: World): void {
        /* The set is of course unordered but we want the list to be
         * sorted by creation time. The world ID is UUID v1 so we can
         * sort them by their time stamp. */
        const worlds = Array.from(set).sort(
            (w1, w2) => World.compare(w1, w2));

        while (this.selWorld.firstChild) {
            this.selWorld.removeChild(this.selWorld.firstChild);
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

    private onDeleteWorld(): void {
        const active = this.selWorld.options.item(this.selWorld.selectedIndex)!;
        confirm(
            `Do you really want to delete the world "${active.text}"?` +
                " Once it's deleted, you can't recover it unless you have exported it to a file.",
            "Yes, delete it",
            "No, keep it"
        ).catch(() => {
            /* As for the next world to activate, we prefer the next
             * one in the list over the previous one.
             */
            const nextIndex =
                this.selWorld.selectedIndex < this.selWorld.options.length -1
                ? this.selWorld.selectedIndex + 1
                : this.selWorld.selectedIndex - 1;
            const next = this.selWorld.options.item(nextIndex)!;

            this.model.activateWorld(next.value);
            this.model.deleteWorld(active.value);
        });
    }
}
