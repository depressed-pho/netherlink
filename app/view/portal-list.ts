import * as Bacon from 'baconjs';
import { Dimension } from 'netherlink/dimension';
import { parseHTML } from 'netherlink/parse-html';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
import { WorldEditorModel } from '../model/world-editor';
import htmlPortalList from './portal-list.html';

export class PortalListView<D extends Dimension> {
    private readonly dimension: D;
    private readonly model: WorldEditorModel;

    private readonly pane: DocumentFragment;
    private readonly tbody: HTMLTableSectionElement;
    private readonly tmplRow: HTMLTemplateElement;

    private readonly world: Bacon.Property<World>;
    private readonly portals: Bacon.Property<Set<Portal<D>>>;
    private readonly selectedPortal: Bacon.Property<Portal<D>>;

    public constructor(dimension: D, model: WorldEditorModel) {
        this.dimension = dimension;
        this.model     = model;

        this.pane    = parseHTML(htmlPortalList);
        this.tbody   = this.pane.querySelector("table > tbody")! as HTMLTableSectionElement;
        this.tmplRow = this.pane.querySelector("template[data-for='row']")! as HTMLTemplateElement;

        this.world          = this.model.world;
        this.portals        = this.model.portals(dimension);
        this.selectedPortal = this.model.selectedPortal(dimension);

        /* The portal list table should be synchronized with one of
         * the portal lists, with sampling the value of the property
         * selectedPortal. */
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
            const colState = row.querySelector("tr > td.nl-state")! as HTMLTableDataCellElement;
            const tmplState = (portal.destination(w) ?
                colState.querySelector("template[data-for='linked']")! :
                colState.querySelector("template[data-for='unlinked']")!) as HTMLTemplateElement;
            while (colState.firstChild) {
                colState.removeChild(colState.firstChild);
            }
            colState.appendChild(tmplState.content);
            colState.style.color = portal.color.string();

            // Coords
            const colCoords = row.querySelector("tr > td.nl-coords")!;
            const coords = portal.location;
            colCoords.textContent = `${coords.x}, ${coords.y}, ${coords.z}`;
            tr.setAttribute('data-coords', coords.toString()); // highlight() uses this.

            // Name
            const colName = row.querySelector("tr > td.nl-name")!;
            colName.textContent = portal.name;

            this.tbody.appendChild(row);
        }
    }

    private highlight(p: Portal<D>) {
        const coords = p ? p.location.toString() : undefined;
        for (const tr of this.tbody.querySelectorAll("tr")) {
            if (tr.getAttribute("data-coords") == coords) {
                tr.classList.add("nl-selected");
            }
            else {
                tr.classList.remove("nl-selected");
            }
        }
    }
}
