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
            fld.addEventListener('change', ev => {
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

        /* The info field is updated whenever a selected portal or
         * coords (for this dimension) changes, but since this is
         * quite costly we throttle the update events for coords.
         */
        this.divInfo = this.pane.querySelector("div[data-for='info']")! as HTMLDivElement;
        const throttleMilliSec = 10;
        const throttledCoords  = this.model.currentCoords(dimension).throttle(throttleMilliSec);
        Bacon.combineAsArray(
            this.model.selectedPortal(dimension),
            throttledCoords as any,
            this.model.world.sampledBy(
                // THINKME: Is there a better way to do this?
                Bacon.combineAsArray(
                    this.model.selectedPortal(dimension),
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
                this.divInfo.textContent =
                    `This portal is linked up with "${linked.name}"` +
                    ` in the ${linked.dimension} located at ${linked.location}.`;
            }
            else {
                // But there are no valid destinations.
                const nominal = this.dimension.scaleAndRestrictForPortal(pt);
                this.divInfo.textContent =
                    `This portal has no destinations. When someone enters it, the game` +
                    ` will create a new portal somewhere around ${nominal} in the` +
                    ` ${this.dimension.portalOpposite} since there are no portals nearby.`;
            }
        }
        else {
            // No portals are selected.
            const virtualPortal = new Portal<D>(this.dimension, pt, "", Color('black'));
            const linked        = virtualPortal.linkedPortal(w);

            if (linked) {
                // But there is a valid destination.
                this.divInfo.appendChild(
                    document.createTextNode(
                        "If a portal is created here, it will link up with "));

                const a = document.createElement("a");
                a.textContent = linked.name;
                a.addEventListener('click', ev => {
                    ev.preventDefault();
                    this.model.selectPortal(linked.dimension, linked);
                });
                this.divInfo.appendChild(a);

                this.divInfo.appendChild(
                    document.createTextNode(
                        ` in the ${linked.dimension} located at ${linked.location}.`));
            }
            else {
                // And there are no valid destinations either.
                const nominal = this.dimension.scaleAndRestrictForPortal(pt);
                this.divInfo.textContent =
                    `If a portal is created here, the game will create a new portal` +
                    ` somewhere around ${nominal} in the ${this.dimension.portalOpposite}` +
                    ` since there are no portals nearby.`;
            }
        }
    }
}
