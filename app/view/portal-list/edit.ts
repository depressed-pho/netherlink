import 'foundation-sites';
import $ = require('jquery');
import Color = require('color');
import { Dimension } from 'netherlink/dimension';
import { Point } from 'netherlink/point';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
import htmlEdit from './edit.html';

class ModalEditPortalView<D extends Dimension> {
    private readonly portal: Portal<D>;
    private readonly resolve: (p: Portal<any>) => void;
    private readonly reject: () => void;

    private readonly modalEdit: HTMLDivElement;
    private readonly form: HTMLFormElement;

    private readonly fldName: HTMLInputElement;
    private readonly fldColor: HTMLInputElement;
    private readonly btnCancel: HTMLButtonElement;
    private readonly btnSubmit: HTMLButtonElement;

    public constructor(
        portal: Portal<D>,
        resolve: (p: Portal<any>) => void,
        reject: () => void) {

        this.portal  = portal;
        this.resolve = resolve;
        this.reject  = reject;

        if (!document.getElementById("modalEditPortal")) {
            const body = document.querySelector("html > body")!;
            body.insertAdjacentHTML("beforeend", htmlEdit);
            $("#modalEditPortal").foundation();
        }

        this.modalEdit = document.getElementById("modalEditPortal")! as HTMLDivElement;
        this.form      = this.modalEdit.querySelector("form")! as HTMLFormElement;
        this.fldName   = this.modalEdit.querySelector("input[name='name']")! as HTMLInputElement;
        this.fldColor  = this.modalEdit.querySelector("input[name='color']")! as HTMLInputElement;
        this.btnCancel = this.modalEdit.querySelector("button[name='cancel']")! as HTMLButtonElement;
        this.btnSubmit = this.modalEdit.querySelector("button[type='submit']")! as HTMLButtonElement;

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
        this.fldName.value  = this.portal.name;
        this.fldColor.value = this.portal.color.hex();

        $(this.modalEdit).foundation("open");
        this.fldName.focus();
    }

    public close(reject = true): void {
        $(this.modalEdit).foundation("close");
    }

    private onSubmit(): void {
        const name   = this.fldName.value;
        const color  = new Color(this.fldColor.value);
        const portal = new Portal(this.portal.dimension, this.portal.location, name, color);

        this.close();
        this.resolve(portal);
        this.fldName.value = "";
        this.fldColor.value = "#000000";
    }
}

/** Open a dialog for editing a portal and return a Promise which will
 * be resolved to a new portal. The promise will be rejected when the
 * user clicks the "Cancel" button.
 */
export function prompt<D extends Dimension>(portal: Portal<D>): Promise<Portal<D>> {
    return new Promise((resolve, reject) => {
        const modal = new ModalEditPortalView<D>(portal, resolve, reject);
        modal.open();
    });
}
