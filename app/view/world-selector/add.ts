import 'foundation-sites';
import $ = require('jquery');
import htmlAdd from './add.html';
import { WorldSelectorModel } from '../../model/world-selector';

export class ModalAddWorldView {
    private readonly model: WorldSelectorModel;

    private readonly modalAdd: HTMLDivElement;
    private readonly form: HTMLFormElement;

    private readonly fldName: HTMLInputElement;
    private readonly btnCancel: HTMLButtonElement;
    private readonly btnSubmit: HTMLButtonElement;

    public constructor(model: WorldSelectorModel) {
        this.model = model;

        let addListeners = false;
        if (!document.getElementById("modalAddWorld")) {
            const body = document.querySelector("html > body")!;
            body.insertAdjacentHTML("beforeend", htmlAdd);
            $("#modalAddWorld").foundation();
            addListeners = true;
        }

        this.modalAdd  = document.getElementById("modalAddWorld")! as HTMLDivElement;
        this.form      = this.modalAdd.querySelector("form")! as HTMLFormElement;
        this.fldName   = this.modalAdd.querySelector("input[name='name']")! as HTMLInputElement;
        this.btnCancel = this.modalAdd.querySelector("button[name='cancel']")! as HTMLButtonElement;
        this.btnSubmit = this.modalAdd.querySelector("button[type='submit']")! as HTMLButtonElement;

        if (addListeners) {
            this.btnCancel.addEventListener("click", ev => this.close());
            this.form.addEventListener("submit", ev => {
                ev.preventDefault();
                this.submit();
            });
        }
    }

    public open(): void {
        this.fldName.value = this.model.newWorldNameCandidate;

        $(this.modalAdd).foundation("open");
        this.fldName.focus();
    }

    public close(): void {
        $(this.modalAdd).foundation("close");
    }

    private submit(): void {
        const name: string = this.fldName.value;

        console.log("FIXME", name);
    }
}
