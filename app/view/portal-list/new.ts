import 'foundation-sites';
import $ = require('jquery');
import Color = require('color');
import { Dimension } from 'netherlink/dimension';
import { Point } from 'netherlink/point';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
import htmlNew from './new.html';

class ModalNewPortalView<D extends Dimension> {
    private readonly world: World;
    private readonly dimension: D;
    private readonly location: Point;
    private readonly resolve: (p: Portal<any>) => void;
    private readonly reject: () => void;

    private readonly modalNew: HTMLDivElement;
    private readonly form: HTMLFormElement;

    private readonly fldName: HTMLInputElement;
    private readonly fldColor: HTMLInputElement;
    private readonly btnCancel: HTMLButtonElement;
    private readonly btnSubmit: HTMLButtonElement;

    public constructor(
        world: World,
        dimension: D,
        location: Point,
        resolve: (p: Portal<any>) => void,
        reject: () => void) {

        this.world     = world;
        this.dimension = dimension;
        this.location  = location;
        this.resolve   = resolve;
        this.reject    = reject;

        let init = false;
        if (!document.getElementById("modalNewPortal")) {
            const body = document.querySelector("html > body")!;
            body.insertAdjacentHTML("beforeend", htmlNew);
            $("#modalNewPortal").foundation();
            init = true;
        }

        this.modalNew  = document.getElementById("modalNewPortal")! as HTMLDivElement;
        this.form      = this.modalNew.querySelector("form")! as HTMLFormElement;
        this.fldName   = this.modalNew.querySelector("input[name='name']")! as HTMLInputElement;
        this.fldColor  = this.modalNew.querySelector("input[name='color']")! as HTMLInputElement;
        this.btnCancel = this.modalNew.querySelector("button[name='cancel']")! as HTMLButtonElement;
        this.btnSubmit = this.modalNew.querySelector("button[type='submit']")! as HTMLButtonElement;

        if (init) {
            this.fldName.value = "";
            this.fldColor.value = "#000000";
        }

        /* Unfortunately, we have to use jQuery to register event
         * handlers because the pure DOM API doesn't provide the
         * functionality of off(). */
        $(this.btnCancel).off('click').on('click', ev => {
            this.close();
            this.reject();
        });
        $(this.form).off('submit').on('submit', ev => {
            ev.preventDefault();
            this.onSubmit();
        });
    }

    public open(): void {
        if (this.fldName.value == "") {
            /* Only put in the candidate if the user hasn't entered
             * nor submitted one. */
            this.fldName.value = this.world.newPortalNameCandidate;
        }
        if (this.fldColor.value == "#000000") {
            // Ditto.
            this.fldColor.value = this.world.newPortalColorCandidate.hex();
        }

        $(this.modalNew).foundation("open");
        this.fldName.focus();
    }

    public close(reject = true): void {
        $(this.modalNew).foundation("close");
    }

    private onSubmit(): void {
        const name   = this.fldName.value;
        const color  = new Color(this.fldColor.value);
        const portal = new Portal(this.dimension, this.location, name, color);

        this.close();
        this.resolve(portal);
        this.fldName.value = "";
        this.fldColor.value = "#000000";
    }
}

/** Open a dialog for creating a new portal and return a Promise. The
 * promise will be rejected when the user clicks the "Cancel" button.
 */
export function prompt<D extends Dimension>(world: World, dimension: D, location: Point): Promise<Portal<D>> {
    return new Promise((resolve, reject) => {
        const modal = new ModalNewPortalView<D>(world, dimension, location, resolve, reject);
        modal.open();
    });
}
