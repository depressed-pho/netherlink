import 'foundation-sites';
import $ = require('jquery');
import htmlNew from './new.html';
import * as Alert from '../alert';
import { WorldSelectorModel } from '../../model/world-selector';

export class ModalNewWorldView {
    private readonly model: WorldSelectorModel;

    private readonly modalNew: HTMLDivElement;
    private readonly form: HTMLFormElement;

    private readonly fldName: HTMLInputElement;
    private readonly btnCancel: HTMLButtonElement;
    private readonly btnSubmit: HTMLButtonElement;

    public constructor(model: WorldSelectorModel) {
        this.model = model;

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
            this.btnCancel.addEventListener("click", ev => this.close());
            this.form.addEventListener("submit", ev => {
                ev.preventDefault();
                this.onSubmit();
            });
            this.fldName.value = "";
        }
    }

    public open(): void {
        if (this.fldName.value == "") {
            /* Only put in the candidate if the user hasn't entered
             * nor submitted one. */
            this.fldName.value = this.model.newWorldNameCandidate;
        }

        $(this.modalNew).foundation("open");
        this.fldName.focus();
    }

    public close(): void {
        $(this.modalNew).foundation("close");
    }

    private onSubmit(): void {
        const name = this.fldName.value;

        let couldSave = false;
        try {
            const world = this.model.newWorld(name);
            this.model.activateWorld(world);
            couldSave = true;
        }
        catch (e) {
            Alert.show(
                "alert", "Cannot save changes",
                `Failed to save the new world: ${e}`);
        }

        this.close();

        if (couldSave) {
            this.fldName.value = "";
        }
    }
}
