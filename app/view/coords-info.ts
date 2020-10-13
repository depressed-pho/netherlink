import * as Bacon from 'baconjs';
import { confirm } from './confirm';
import { Dimension, Overworld, Nether } from 'netherlink/dimension';
import { parseHTML } from 'netherlink/parse-html';
import { Point } from 'netherlink/point';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
import { WorldEditorModel } from '../model/world-editor';
import htmlCoordsInfo from './coords-info.html';

export class CoordsInfoView<D extends Dimension> {
    private readonly dimension: D;
    private readonly model: WorldEditorModel;

    private readonly pane: DocumentFragment;
    private readonly fldX: HTMLInputElement;
    private readonly fldY: HTMLInputElement;
    private readonly fldZ: HTMLInputElement;

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
    }

    public get fragment(): DocumentFragment {
        return this.pane;
    }
}
