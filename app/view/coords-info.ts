import * as Bacon from 'baconjs';
import { confirm } from './confirm';
import { Dimension, Overworld, Nether } from 'netherlink/dimension';
import { parseHTML } from 'netherlink/parse-html';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
import { WorldEditorModel } from '../model/world-editor';
import htmlCoordsInfo from './coords-info.html';

export class CoordsInfoView<D extends Dimension> {
    private readonly dimension: D;
    private readonly model: WorldEditorModel;

    private readonly pane: DocumentFragment;

    public constructor(dimension: D, model: WorldEditorModel) {
        this.dimension = dimension;
        this.model     = model;

        this.pane = parseHTML(htmlCoordsInfo);

        /* The caption text (showing the dimension name) never changes
         * once it's initialized. */
        this.pane.querySelector("span[data-dimension]")!
            .textContent = this.dimension.name;
    }

    public get fragment(): DocumentFragment {
        return this.pane;
    }
}
