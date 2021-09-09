import $ = require('jquery');
import * as Bacon from 'baconjs';
import { confirm } from './confirm';
import { Dimension, Overworld, Nether } from 'netherlink/dimension';
import { parseHTML } from 'netherlink/parse-html';
import { Point } from 'netherlink/point';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
import { WorldEditorModel } from '../model/world-editor';
import * as Alert from './alert';
import * as ModalEditPortal from './portal-list/edit';
import * as ModalNewPortal from './portal-list/new';
import htmlPortalList from './portal-list.html';

export class PortalListView<D extends Dimension> {
    private readonly dimension: D;
    private readonly model: WorldEditorModel;

    private readonly pane: DocumentFragment;
    private readonly btnNew: HTMLButtonElement;
    private readonly btnDelete: HTMLButtonElement;
    private readonly btnEdit: HTMLButtonElement;
    private readonly tbody: HTMLTableSectionElement;
    private readonly tmplRow: HTMLTemplateElement;

    private readonly world: Bacon.Property<World>;
    private readonly portals: Bacon.Property<Set<Portal<D>>>;
    private readonly selectedPortal: Bacon.Property<Portal<D>|null>;

    public constructor(dimension: D, model: WorldEditorModel) {
        this.dimension = dimension;
        this.model     = model;

        this.pane = parseHTML(htmlPortalList);

        this.world          = this.model.world;
        this.portals        = this.model.portals(dimension);
        this.selectedPortal = this.model.selectedPortal(dimension);

        /* The caption text (showing the dimension name) never changes
         * once it's initialized. */
        this.pane.querySelector("table > caption > span[data-dimension]")!
            .textContent = this.dimension.name;

        /* The "New portal" button is enabled when no portals are
         * selected, and will open a modal window when clicked. */
        this.btnNew   = this.pane.querySelector("button[data-for='create']")! as HTMLButtonElement;
        this.selectedPortal.onValue(sel => {
            this.btnNew.disabled = sel != null;
        });
        const newClicked = Bacon.fromEvent(this.btnNew, 'click');
        Bacon.combineAsArray(
            this.world,
            this.model.currentCoords(dimension) as any)
            .sampledBy(newClicked)
            .onValue(([w, pt]: any) => this.onNewPortal(w, pt));

        /* The "Delete portal" button is enabled when a portal is
         * selected. */
        this.btnDelete = this.pane.querySelector("button[data-for='delete']")! as HTMLButtonElement;
        this.selectedPortal.onValue(sel => {
            this.btnDelete.disabled = sel == null;
        });
        const deleteClicked = Bacon.fromEvent(this.btnDelete, 'click');
        this.selectedPortal.sampledBy(deleteClicked).onValue(sel => {
            if (sel) {
                this.onDeletePortal(sel);
            }
        });

        /* The "Edit portal" button is enabled when a portal is
         * selected. */
        this.btnEdit = this.pane.querySelector("button[data-for='edit']")! as HTMLButtonElement;
        this.selectedPortal.onValue(sel => {
            this.btnEdit.disabled = sel == null;
        });
        const editClicked = Bacon.fromEvent(this.btnEdit, 'click');
        this.selectedPortal.sampledBy(editClicked).onValue(sel => {
            if (sel) {
                this.onEditPortal(sel);
            }
        });

        /* The portal list table should be synchronized with one of
         * the portal lists, with sampling the value of the property
         * selectedPortal. */
        this.tbody   = this.pane.querySelector("table > tbody")! as HTMLTableSectionElement;
        this.tmplRow = this.pane.querySelector("template[data-for='row']")! as HTMLTemplateElement;
        Bacon.combineAsArray(
            this.portals,
            this.selectedPortal.sampledBy(this.portals) as any,
            this.world.sampledBy(this.portals) as any)
            .onValue(([set, selected, w]: any) => this.refreshPortals(set, selected, w));

        /* Apply changes to the selected portal. */
        this.selectedPortal.onValue(p => this.highlight(p));
    }

    public get fragment(): DocumentFragment {
        return this.pane;
    }

    private async onNewPortal(w: World, pt: Point) {
        let p: Portal<D>;
        try {
            p = await ModalNewPortal.prompt(w, this.dimension, pt);
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
            this.model.addPortal(p);
        }
        catch (e) {
            Alert.show(
                "alert", "Cannot save changes",
                `Failed to save changes to the world: ${e}`);
        }
    }

    private async onEditPortal(p: Portal<D>) {
        let np: Portal<D>;
        try {
            np = await ModalEditPortal.prompt(p);
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
            this.model.addPortal(np);
        }
        catch (e) {
            Alert.show(
                "alert", "Cannot save changes",
                `Failed to save changes to the world: ${e}`);
        }
    }

    private async onDeletePortal(p: Portal<D>) {
        /* It's very easy to mistap a small button on a touch
         * screen. If we deleted it without confirmation, users would
         * not be happy. */
        try {
            await confirm(
                `Do you really want to delete the portal "${p.name}", ` +
                    `located at ${p.location} in the ${this.dimension}?`,
                "Yes, delete it",
                "No, keep it");
        }
        catch (e) {
            if (e === undefined) {
                try {
                    this.model.deletePortal(p);
                }
                catch (e) {
                    Alert.show(
                        "alert", "Cannot save changes",
                        `Failed to save changes to the world: ${e}`);
                }
            }
            else {
                throw e;
            }
        }
    }

    private refreshPortals(set: Set<Portal<D>>, selected: Portal<D>|null, w: World) {
        const portals = Array.from(set).sort(
            (p1, p2) => Portal.compare(p1, p2));

        while (this.tbody.firstChild) {
            this.tbody.removeChild(this.tbody.firstChild);
        }
        for (const portal of portals) {
            /* For whatever reason, Node#cloneNode() returns Node, not
             * polymorphic this. Isn't this a bug? */
            const row = this.tmplRow.content.cloneNode(true) as DocumentFragment;

            // Is it selected?
            const tr = row.querySelector("tr")!;
            if (selected && portal.equals(selected)) {
                tr.classList.add("nl-selected");
            }
            tr.addEventListener('click', ev => {
                // Select it when clicked.
                this.model.selectPortal(this.dimension, portal);
            });

            // State
            const colState  = row.querySelector("tr > td.nl-state")! as HTMLTableDataCellElement;
            const linked    = portal.linkedPortal(w);
            const tmplState = (() => {
                if (linked) {
                    const tmpl = colState.querySelector("template[data-for='linked']")! as HTMLTemplateElement;
                    tmpl.content.querySelector("i")!.title =
                        `This portal is linked with ${linked.name}.`;
                    return tmpl;
                }
                else {
                    return colState.querySelector("template[data-for='unlinked']")! as HTMLTemplateElement;
                }
            })();
            while (colState.firstChild) {
                colState.removeChild(colState.firstChild);
            }
            colState.appendChild(tmplState.content);
            colState.style.color = portal.color.string();

            // Coords
            const colCoords = row.querySelector("tr > td.nl-coords")!;
            const coords = portal.location;
            colCoords.textContent = `${coords.x}, ${coords.y}, ${coords.z}`;
            tr.dataset.coords = coords.toString(); // highlight() uses this.

            // Name
            const colName = row.querySelector("tr > td.nl-name")!;
            colName.textContent = portal.name;

            this.tbody.appendChild(row);

            /* Scroll the tbody so that a selected row is visible. */
            if (selected && portal.equals(selected)) {
                tr.scrollIntoView({behavior: 'smooth'});
            }
        }
    }

    private highlight(p: Portal<D>|null) {
        const coords = p ? p.location.toString() : undefined;
        for (const tr of this.tbody.querySelectorAll("tr")) {
            if (tr.dataset.coords == coords) {
                tr.classList.add("nl-selected");

                /* Scroll the tbody so that this row is visible. */
                tr.scrollIntoView({behavior: 'smooth'});
            }
            else {
                tr.classList.remove("nl-selected");
            }
        }
    }
}
