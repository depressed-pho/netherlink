import 'foundation-sites';
import $ = require('jquery');
import htmlNew from './new.html';
import * as Alert from '../alert';
import { World } from 'netherlink/world';

class ModalNewWorldView {
    private readonly defaultName: string;
    private readonly resolve: (w: World) => void;
    private readonly reject: () => void;

    private readonly modalNew: HTMLDivElement;
    private readonly form: HTMLFormElement;

    private readonly fldName: HTMLInputElement;
    private readonly btnCancel: HTMLButtonElement;
    private readonly btnSubmit: HTMLButtonElement;

    public constructor(defaultName: string,
                       resolve: (w: World) => void,
                       reject: () => void) {

        this.defaultName = defaultName;
        this.resolve     = resolve;
        this.reject      = reject;

        let init = false;
        if (!document.getElementById("modalNewWorld")) {
            const body = document.querySelector("html > body")!;
            body.insertAdjacentHTML("beforeend", htmlNew);
            $("#modalNewWorld").foundation();
            init = true;
        }

        this.modalNew  = document.getElementById("modalNewWorld")! as HTMLDivElement;
        this.form      = this.modalNew.querySelector("form")! as HTMLFormElement;
        this.fldName   = this.modalNew.querySelector("input[name='name']")! as HTMLInputElement;
        this.btnCancel = this.modalNew.querySelector("button[name='cancel']")! as HTMLButtonElement;
        this.btnSubmit = this.modalNew.querySelector("button[type='submit']")! as HTMLButtonElement;

        if (init) {
            this.fldName.value = "";
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
            this.fldName.value = this.defaultName;
        }

        $(this.modalNew).foundation("open");
        this.fldName.focus();
    }

    public close(): void {
        $(this.modalNew).foundation("close");
    }

    private onSubmit(): void {
        const name = this.fldName.value;

        this.close();
        this.resolve(new World(name));
        this.fldName.value = "";
    }
}

/** Open a dialog for creating a new world and return a Promise. The
 * promise will be rejected when the user clicks the "Cancel" button.
 */
export function prompt(defaultName: string): Promise<World> {
    return new Promise((resolve, reject) => {
        const modal = new ModalNewWorldView(defaultName, resolve, reject);
        modal.open();
    });
}
