import * as Bacon from 'baconjs';
import { saveAs } from 'file-saver';
import * as pako from 'pako';
import { confirm } from './confirm';
import { chooseFile } from 'netherlink/choose-file';
import { readFile } from 'netherlink/read-file';
import { World, WorldID } from 'netherlink/world';
import pbRoot from 'netherlink/world.proto';
import * as Alert from './alert';
import { WorldSelectorModel } from '../model/world-selector';
import * as ModalNewWorld from './world-selector/new';
import * as ModalRenameWorld from './world-selector/rename';

export class WorldSelectorView {
    private readonly model: WorldSelectorModel;

    private readonly selWorld: HTMLSelectElement;

    private readonly btnNew: HTMLButtonElement;
    private readonly btnDelete: HTMLButtonElement;
    private readonly btnRename: HTMLButtonElement;
    private readonly btnExport: HTMLButtonElement;
    private readonly btnImport: HTMLButtonElement;

    public constructor(model: WorldSelectorModel) {
        this.model = model;

        /* The world selector control is synchronized with the world
         * list and the active world property. */
        this.selWorld = document.getElementById("selWorld")! as HTMLSelectElement;
        Bacon.combineAsArray(model.worlds, model.activeWorld as any)
            .onValue(([set, active]: any) => this.refreshList(set, active));
        this.selWorld.addEventListener("input", ev => this.onSelectWorld());

        /* The "New..." button is always enabled and will open a modal
         * window when clicked. */
        this.btnNew = document.getElementById("btnNewWorld")! as HTMLButtonElement;
        this.btnNew.addEventListener("click", ev => this.onNewWorld());

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
        const renameClicked = Bacon.fromEvent(this.btnRename, 'click');
        this.model.activeWorld.sampledBy(renameClicked).onValue(w => this.onRenameWorld(w));

        /* The "Export..." button is always enabled and will open a
         * "save file" window when clicked. */
        this.btnExport = document.getElementById("btnExportWorld")! as HTMLButtonElement;
        const exportClicked = Bacon.fromEvent(this.btnExport, 'click');
        this.model.activeWorld.sampledBy(exportClicked).onValue(w => this.onExportWorld(w));

        /* The "Import..." button is always enabled and will open a
         * "open file" window when clicked. */
        this.btnImport = document.getElementById("btnImportWorld")! as HTMLButtonElement;
        this.btnImport.addEventListener("click", ev => this.onImportWorld());
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

    private onSelectWorld() {
        const active: HTMLOptionElement =
            this.selWorld.options.item(this.selWorld.selectedIndex)!;

        this.model.activateWorld(active.value);
    }

    private async onNewWorld() {
        let w: World;
        try {
            w = await ModalNewWorld.prompt(this.model.newWorldNameCandidate);
        }
        catch (e) {
            if (e === undefined) {
                return; // Canceled
            }
            else {
                throw e;
            }
        }

        try {
            this.model.newWorld(w);
            this.model.activateWorld(w);
        }
        catch (e) {
            Alert.show(
                "alert", "Cannot save changes",
                `Failed to save the new world: ${e}`);
        }
    }

    private async onDeleteWorld() {
        const active: HTMLOptionElement =
            this.selWorld.options.item(this.selWorld.selectedIndex)!;
        try {
            await confirm(
                `Do you really want to delete the world "${active.text}"?` +
                    " Once it's deleted, you can't recover it unless you have exported it to a file.",
                "Yes, delete it",
                "No, keep it");
        }
        catch (e) {
            if (e === undefined) {
                /* As for the next world to activate, we prefer the next
                 * one in the list over the previous one.
                 */
                const nextIndex =
                    this.selWorld.selectedIndex < this.selWorld.options.length -1
                    ? this.selWorld.selectedIndex + 1
                    : this.selWorld.selectedIndex - 1;
                const next = this.selWorld.options.item(nextIndex)!;

                try {
                    this.model.activateWorld(next.value);
                    this.model.deleteWorld(active.value);
                }
                catch (e) {
                    Alert.show(
                        "alert", "Cannot save changes",
                        `Failed to delete the world: ${e}`);
                }
            }
            else {
                throw e;
            }
        }
    }

    private async onRenameWorld(w: World) {
        let nw: World;
        try {
            nw = await ModalRenameWorld.prompt(w);
        }
        catch (e) {
            if (e === undefined) {
                return; // Canceled
            }
            else {
                throw e;
            }
        }

        try {
            this.model.storeWorld(nw);
        }
        catch (e) {
            Alert.show(
                "alert", "Cannot save changes",
                `Failed to save the new world: ${e}`);
        }
    }

    private onExportWorld(world: World) {
        const msg = World.toMessage(world);

        const invalid = pbRoot.netherlink.World.verify(msg);
        if (invalid) {
            // Should not happen unless our code is broken.
            throw new Error(invalid);
        }

        const raw     = pbRoot.netherlink.World.encode(msg).finish();
        const gzipped = pako.gzip(raw);
        const blob    = new Blob([gzipped], {type: "application/octet-stream"});

        saveAs(blob, `${world.name}.nlinks`);
    }

    private async onImportWorld() {
        try {
            const file    = await chooseFile({accept: [".nlinks"]});
            const gzipped = new Uint8Array(await readFile(file));
            const raw     = pako.ungzip(gzipped);
            const msg     = pbRoot.netherlink.World.decode(raw);
            const world   = World.fromMessage(msg);

            if (this.model.hasWorld(world.id)) {
                try {
                    await confirm(
                        `The world to be imported as "${world.name}" already exists.` +
                            " Do you want to replace it?",
                        "Yes, replace it",
                        "No, keep it");

                    // User chose to keep it.
                    return;
                }
                catch (e) {
                    if (e === undefined) {
                        // User chose to replace it.
                    }
                    else {
                        throw e;
                    }
                }
            }

            this.model.newWorld(world);
            this.model.activateWorld(world);
        }
        catch (e) {
            Alert.show(
                "alert", "Cannot import file",
                `Failed to import the file: ${e}`);
        }
    }
}
