import 'foundation-sites';
import $ = require('jquery');
import htmlRename from './rename.html';
import * as Alert from '../alert';
import { World } from 'netherlink/world';

class ModalRenameWorldView {
    private readonly world: World;
    private readonly resolve: (w: World) => void;
    private readonly reject: () => void;

    private readonly modalRename: HTMLDivElement;
    private readonly form: HTMLFormElement;

    private readonly fldName: HTMLInputElement;
    private readonly btnCancel: HTMLButtonElement;
    private readonly btnSubmit: HTMLButtonElement;

    public constructor(world: World,
                       resolve: (w: World) => void,
                       reject: () => void) {

        this.world   = world;
        this.resolve = resolve;
        this.reject  = reject;

        if (!document.getElementById("modalRenameWorld")) {
            const body = document.querySelector("html > body")!;
            body.insertAdjacentHTML("beforeend", htmlRename);
            $("#modalRenameWorld").foundation();
        }

        this.modalRename = document.getElementById("modalRenameWorld")! as HTMLDivElement;
        this.form        = this.modalRename.querySelector("form")! as HTMLFormElement;
        this.fldName     = this.modalRename.querySelector("input[name='name']")! as HTMLInputElement;
        this.btnCancel   = this.modalRename.querySelector("button[name='cancel']")! as HTMLButtonElement;
        this.btnSubmit   = this.modalRename.querySelector("button[type='submit']")! as HTMLButtonElement;

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
        this.fldName.value = this.world.name;

        $(this.modalRename).foundation("open");
        this.fldName.focus();
    }

    public close(): void {
        $(this.modalRename).foundation("close");
    }

    private onSubmit(): void {
        this.world.name = this.fldName.value;

        this.close();
        this.resolve(this.world);
    }
}

/** Open a dialog for renaming an existing world and return a
 * Promise. The promise will be rejected when the user clicks the
 * "Cancel" button.
 */
export function prompt(world: World): Promise<World> {
    return new Promise((resolve, reject) => {
        const modal = new ModalRenameWorldView(world, resolve, reject);
        modal.open();
    });
}
