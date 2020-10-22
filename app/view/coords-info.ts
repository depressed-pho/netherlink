import * as Bacon from 'baconjs';
import { confirm } from './confirm';
import { Dimension, Overworld, Nether } from 'netherlink/dimension';
import { parseHTML } from 'netherlink/parse-html';
import { Point } from 'netherlink/point';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
import { WorldEditorModel } from '../model/world-editor';
import htmlCoordsInfo from './coords-info.html';
import Color = require('color');

export class CoordsInfoView<D extends Dimension> {
    private readonly dimension: D;
    private readonly model: WorldEditorModel;

    private readonly pane: DocumentFragment;
    private readonly fldX: HTMLInputElement;
    private readonly fldY: HTMLInputElement;
    private readonly fldZ: HTMLInputElement;
    private readonly divInfo: HTMLDivElement;

    private readonly tmplSelectedLinked: HTMLTemplateElement;
    private readonly tmplSelectedUnlinked: HTMLTemplateElement;
    private readonly tmplUnselectedLinked: HTMLTemplateElement;
    private readonly tmplUnselectedUnlinked: HTMLTemplateElement;

    public constructor(dimension: D, model: WorldEditorModel) {
        this.dimension = dimension;
        this.model     = model;

        this.pane = parseHTML(htmlCoordsInfo);

        /* The caption text (showing the dimension name) never changes
         * once it's initialized. */
        this.pane.querySelector("span[data-dimension]")!
            .textContent = this.dimension.name;

        /* The coords input fields are synchronized with the
         * corresponding coords property. */
        this.fldX = this.pane.querySelector("input[data-for='x']")! as HTMLInputElement;
        this.fldY = this.pane.querySelector("input[data-for='y']")! as HTMLInputElement;
        this.fldZ = this.pane.querySelector("input[data-for='z']")! as HTMLInputElement;
        this.model.currentCoords(dimension).onValue(pt => {
            this.fldX.value = String(pt.x);
            this.fldY.value = String(pt.y);
            this.fldZ.value = String(pt.z);
        });
        for (let fld of [this.fldX, this.fldY, this.fldZ]) {
            fld.addEventListener('input', ev => {
                this.model.currentCoords(
                    dimension,
                    new Point(
                        Number(this.fldX.value),
                        Number(this.fldY.value),
                        Number(this.fldZ.value)));
            });
        }

        /* The Y coordinate input field should have a constraint. */
        this.fldY.max = String(dimension.portalHeightLimit);
        this.fldY.min = String(0);

        /* The info field is updated whenever the set of portals, a
         * selected portal, or coords (for this dimension) changes,
         * but since this is quite costly we throttle the update
         * events for coords.
         */
        this.divInfo                = this.pane.querySelector("div[data-for='info']")! as HTMLDivElement;
        this.tmplSelectedLinked     = this.pane.querySelector("template[data-selected='true'][data-linked='true']")! as HTMLTemplateElement;
        this.tmplSelectedUnlinked   = this.pane.querySelector("template[data-selected='true'][data-linked='false']")! as HTMLTemplateElement;
        this.tmplUnselectedLinked   = this.pane.querySelector("template[data-selected='false'][data-linked='true']")! as HTMLTemplateElement;
        this.tmplUnselectedUnlinked = this.pane.querySelector("template[data-selected='false'][data-linked='false']")! as HTMLTemplateElement;

        const throttleMilliSec = 10;
        const throttledCoords  = this.model.currentCoords(dimension).throttle(throttleMilliSec);
        Bacon.combineAsArray(
            this.model.selectedPortal(dimension),
            throttledCoords as any,
            this.model.world.sampledBy(
                Bacon.combineAsArray(
                    this.model.portals(dimension),
                    this.model.selectedPortal(dimension) as any,
                    throttledCoords as any)) as any)
            .onValue(([sel, pt, w]: any) => this.updateInfo(sel, pt, w));
    }

    public get fragment(): DocumentFragment {
        return this.pane;
    }

    private updateInfo(sel: Portal<D>|null, pt: Point, w: World) {
        while (this.divInfo.firstChild) {
            this.divInfo.removeChild(this.divInfo.firstChild);
        }

        if (sel) {
            // There is a selected portal.
            const linked = sel.linkedPortal(w);

            if (linked) {
                // And there is a valid destination.
                const frag = this.tmplSelectedLinked.content.cloneNode(true) as DocumentFragment;

                const name = frag.querySelector("a[data-for='name']")! as HTMLAnchorElement;
                name.textContent = linked.name;
                name.style.setProperty("color", linked.color.toString());
                name.addEventListener("click", ev => {
                    ev.preventDefault();
                    this.onPortalLinkClicked(linked);
                });

                const dim = frag.querySelector("span[data-for='dimension']")! as HTMLSpanElement;
                dim.textContent = linked.dimension.toString();

                const loc = frag.querySelector("span[data-for='location']")! as HTMLSpanElement;
                loc.textContent = linked.location.toString();

                this.divInfo.appendChild(frag);

                if (!pt.within(linked.searchArea())) {
                    const oneWay = this.divInfo.querySelector("template[data-for='one-way']")! as HTMLTemplateElement;

                    const name = oneWay.content.querySelector("span[data-for='name']")! as HTMLSpanElement;
                    name.textContent = linked.name;
                    name.style.setProperty("color", linked.color.toString());

                    this.divInfo.appendChild(oneWay.content);
                }
            }
            else {
                // But there are no valid destinations.
                const oppositeD = this.dimension.portalOpposite as any;
                const nominal   = this.dimension.scaleAndRestrictForPortal(pt);

                const frag = this.tmplSelectedUnlinked.content.cloneNode(true) as DocumentFragment;

                const loc = frag.querySelector("a[data-for='location']")! as HTMLAnchorElement;
                loc.textContent = nominal.toString();
                loc.addEventListener("click", ev => {
                    ev.preventDefault();
                    this.onCoordsLinkClicked(oppositeD, nominal);
                });

                const dim = frag.querySelector("span[data-for='dimension']")! as HTMLSpanElement;
                dim.textContent = oppositeD.toString();

                this.divInfo.appendChild(frag);
            }
        }
        else {
            // No portals are selected.
            const virtualPortal = new Portal<D>(this.dimension, pt, "", Color('black'));
            const linked        = virtualPortal.linkedPortal(w);

            if (linked) {
                // But there is a valid destination.
                const frag = this.tmplUnselectedLinked.content.cloneNode(true) as DocumentFragment;

                const name = frag.querySelector("a[data-for='name']")! as HTMLAnchorElement;
                name.textContent = linked.name;
                name.style.setProperty("color", linked.color.toString());
                name.addEventListener("click", ev => {
                    ev.preventDefault();
                    this.onPortalLinkClicked(linked);
                });

                const dim = frag.querySelector("span[data-for='dimension']")! as HTMLSpanElement;
                dim.textContent = linked.dimension.toString();

                const loc = frag.querySelector("span[data-for='location']")! as HTMLSpanElement;
                loc.textContent = linked.location.toString();

                this.divInfo.appendChild(frag);

                if (!pt.within(linked.searchArea())) {
                    const oneWay = this.divInfo.querySelector("template[data-for='one-way']")! as HTMLTemplateElement;

                    const name = oneWay.content.querySelector("span[data-for='name']")! as HTMLSpanElement;
                    name.textContent = linked.name;
                    name.style.setProperty("color", linked.color.toString());

                    this.divInfo.appendChild(oneWay.content);
                }
            }
            else {
                // And there are no valid destinations either.
                const oppositeD = this.dimension.portalOpposite as any;
                const nominal   = this.dimension.scaleAndRestrictForPortal(pt);

                const frag = this.tmplUnselectedUnlinked.content.cloneNode(true) as DocumentFragment;

                const loc = frag.querySelector("a[data-for='location']")! as HTMLAnchorElement;
                loc.textContent = nominal.toString();
                loc.addEventListener("click", ev => {
                    ev.preventDefault();
                    this.onCoordsLinkClicked(oppositeD, nominal);
                });

                const dim = frag.querySelector("span[data-for='dimension']")! as HTMLSpanElement;
                dim.textContent = oppositeD.toString();

                this.divInfo.appendChild(frag);
            }
        }
    }

    private onPortalLinkClicked<D1 extends Dimension>(p: Portal<D1>) {
        this.model.selectPortal(p.dimension, p);
    }

    private onCoordsLinkClicked<D1 extends Dimension>(dim: D, pt: Point) {
        this.model.currentCoords(dim, pt);
    }
}
