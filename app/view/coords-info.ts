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
        this.fldY.min = String(dimension.minAltitude);
        this.fldY.max = String(dimension.maxAltitude);

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
                name.title = `Located at ${linked.location}`;
                name.style.setProperty("color", linked.color.toString());
                name.addEventListener("click", ev => {
                    ev.preventDefault();
                    this.onPortalLinkClicked(linked);
                });

                const dim = frag.querySelector("span[data-for='dimension']")! as HTMLSpanElement;
                dim.textContent = linked.dimension.toString();

                this.divInfo.appendChild(frag);

                if (!pt.within(linked.searchArea())) {
                    // But the portal is not within the search range
                    // of the destination.
                    const oneWay = this.divInfo.querySelector("template[data-for='one-way'][data-reason='outside']")! as HTMLTemplateElement;

                    const name = oneWay.content.querySelector("span[data-for='name']")! as HTMLSpanElement;
                    name.textContent = linked.name;
                    name.style.setProperty("color", linked.color.toString());

                    this.divInfo.appendChild(oneWay.content);
                }
                else {
                    const reflected = linked.linkedPortal(w)!;
                    if (reflected.equals(sel)) {
                        // It's actually bidirectional.
                        const bidi = this.divInfo.querySelector("template[data-for='bidirectional']")! as HTMLTemplateElement;
                        this.divInfo.appendChild(bidi.content);
                    }
                    else {
                        // The linkage is suboptimal.
                        const nominal = linked.nominalDestination;

                        const oneWay = this.divInfo.querySelector("template[data-for='one-way'][data-reason='suboptimal']")! as HTMLTemplateElement;

                        const name = oneWay.content.querySelector("a[data-for='name']")! as HTMLAnchorElement;
                        name.textContent = reflected.name;
                        name.title = `Located at ${reflected.location}`;
                        name.style.setProperty("color", reflected.color.toString());
                        name.addEventListener("click", ev => {
                            ev.preventDefault();
                            this.onPortalLinkClicked(reflected);
                        });

                        const nomA = oneWay.content.querySelector("a[data-for='nominal']")! as HTMLAnchorElement;
                        nomA.title = String(nominal);
                        nomA.addEventListener("click", ev => {
                            ev.preventDefault();
                            this.onCoordsLinkClicked(this.dimension, nominal);
                        });

                        this.divInfo.appendChild(oneWay.content);
                    }
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
                    // But it's not within the search range of the
                    // destination.
                    const oneWay = this.divInfo.querySelector("template[data-for='one-way'][data-reason='outside']")! as HTMLTemplateElement;

                    const name = oneWay.content.querySelector("span[data-for='name']")! as HTMLSpanElement;
                    name.textContent = linked.name;
                    name.style.setProperty("color", linked.color.toString());

                    this.divInfo.appendChild(oneWay.content);
                }
                else {
                    const worldWithV = w.clone();
                    worldWithV.portals(virtualPortal.dimension).add(virtualPortal);

                    const nominal   = linked.nominalDestination;
                    const reflected = linked.linkedPortal(worldWithV)!;
                    if (reflected.equals(virtualPortal)) {
                        // It will actually be bidirectional.
                        const oldLink = linked.linkedPortal(w);
                        if (oldLink) {
                            // But there was a suboptimal linkage before.
                            const override = this.divInfo.querySelector("template[data-for='override']")! as HTMLTemplateElement;

                            const nomA = override.content.querySelector("a[data-for='nominal']")! as HTMLAnchorElement;
                            nomA.title = String(nominal);
                            nomA.addEventListener("click", ev => {
                                ev.preventDefault();
                                this.onCoordsLinkClicked(this.dimension, nominal);
                            });

                            const name = override.content.querySelector("span[data-for='name']")! as HTMLSpanElement;
                            name.textContent = linked.name;
                            name.style.setProperty("color", linked.color.toString());

                            const oldName = override.content.querySelector("a[data-for='old-name']")! as HTMLAnchorElement;
                            oldName.textContent = oldLink.name;
                            oldName.title = `Located at ${oldLink.location}`;
                            oldName.style.setProperty("color", oldLink.color.toString());
                            oldName.addEventListener("click", ev => {
                                ev.preventDefault();
                                this.onPortalLinkClicked(oldLink);
                            });

                            this.divInfo.appendChild(override.content);
                        }
                        else {
                            // There wasn't a linkage before.
                            const bidi = this.divInfo.querySelector("template[data-for='bidirectional']")! as HTMLTemplateElement;
                            this.divInfo.appendChild(bidi.content);
                        }
                    }
                    else {
                        // It's gonna be suboptimal.
                        const oneWay = this.divInfo.querySelector("template[data-for='one-way'][data-reason='suboptimal']")! as HTMLTemplateElement;

                        const name = oneWay.content.querySelector("a[data-for='name']")! as HTMLAnchorElement;
                        name.textContent = reflected.name;
                        name.title = `Located at ${reflected.location}`;
                        name.style.setProperty("color", reflected.color.toString());
                        name.addEventListener("click", ev => {
                            ev.preventDefault();
                            this.onPortalLinkClicked(reflected);
                        });

                        const nomA = oneWay.content.querySelector("a[data-for='nominal']")! as HTMLAnchorElement;
                        nomA.title = String(nominal);
                        nomA.addEventListener("click", ev => {
                            ev.preventDefault();
                            this.onCoordsLinkClicked(this.dimension, nominal);
                        });

                        this.divInfo.appendChild(oneWay.content);
                    }
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
