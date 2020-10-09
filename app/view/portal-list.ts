import * as Bacon from 'baconjs';
import { Dimension } from 'netherlink/dimension';
import { parseHTML } from 'netherlink/parse-html';
import { Portal } from 'netherlink/portal';
import { WorldEditorModel } from '../model/world-editor';
import htmlPortalList from './portal-list.html';

export class PortalListView<D extends Dimension> {
    private readonly dimension: D;
    private readonly model: WorldEditorModel;

    private readonly pane: DocumentFragment;
    private readonly tbody: HTMLTableSectionElement;
    private readonly tmplRow: HTMLTemplateElement;

    private readonly portals: Bacon.Property<Set<Portal<D>>>;
    private readonly chosenPortal: Bacon.Property<Portal<D>>;

    public constructor(dimension: D, model: WorldEditorModel) {
        this.dimension = dimension;
        this.model     = model;

        this.pane    = parseHTML(htmlPortalList);
        this.tbody   = this.pane.querySelector("table > tbody")! as HTMLTableSectionElement;
        this.tmplRow = this.pane.querySelector("template[data-for='row']")! as HTMLTemplateElement;

        this.portals      = this.model.portals(dimension);
        this.chosenPortal = this.model.chosenPortal(dimension);

        /* The portal list table should be synchronized with one of
         * the portal lists, with sampling the value of the property
         * chosenPortal. */
        Bacon.combineAsArray(
            this.portals,
            this.chosenPortal.sampledBy(this.portals) as any)
            .onValue(([set, chosen]: any) => this.refreshPortals(set, chosen));
    }

    public get fragment(): DocumentFragment {
        return this.pane;
    }

    private refreshPortals(set: Set<Portal<D>>, chosen: Portal<D>) {
        const portals = Array.from(set).sort(
            (p1, p2) => Portal.compare(p1, p2));

        console.log(portals, chosen);
    }
}
