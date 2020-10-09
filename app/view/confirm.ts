import 'foundation-sites';
import $ = require('jquery');
import htmlConfirm from './confirm.html';

class ModalConfirmationView {
    private readonly modalConfirm: HTMLDivElement;
    private readonly paraMessage: HTMLParagraphElement;
    private readonly btnSecondary: HTMLButtonElement;
    private readonly btnPrimary: HTMLButtonElement;

    public constructor(
        message: string,
        secondaryButtonLabel: string, secondaryAction: () => void,
        primaryButtonLabel: string, primaryAction: () => void) {

        if (!document.getElementById("modalConfirm")) {
            const body = document.querySelector("html > body")!;
            body.insertAdjacentHTML("beforeend", htmlConfirm);
            $("#modalConfirm").foundation();
        }

        this.modalConfirm = document.getElementById("modalConfirm")! as HTMLDivElement;
        this.paraMessage  = this.modalConfirm.querySelector("p[data-message]")! as HTMLParagraphElement;
        this.btnSecondary = this.modalConfirm.querySelector("button[name='secondary']")! as HTMLButtonElement;
        this.btnPrimary   = this.modalConfirm.querySelector("button[name='primary']")! as HTMLButtonElement;

        this.paraMessage .textContent = message;
        this.btnSecondary.textContent = secondaryButtonLabel;
        this.btnPrimary  .textContent = primaryButtonLabel;

        /* Unfortunately, we have to use jQuery to register event
         * handlers because the pure DOM API doesn't provide the
         * functionality of off(). */
        $(this.btnSecondary).off('click').on('click', () => {
            this.close();
            secondaryAction();
        });
        $(this.btnPrimary).off('click').on('click', () => {
            this.close();
            primaryAction();
        });
    }

    public open(): void {
        $(this.modalConfirm).foundation("open");
    }

    public close(): void {
        $(this.modalConfirm).foundation("close");
    }
}

/** Open a confirmation dialog and return a Promise. The promise will
 * be resolved with null when the user clicks the primary button, or
 * rejected with null when the user clicks the secondary button.
 */
export function confirm(
    message: string,
    secondaryButtonLabel: string,
    primaryButtonLabel: string): Promise<void> {

    return new Promise((resolve, reject) => {
        const modal = new ModalConfirmationView(
            message,
            secondaryButtonLabel, () => reject(),
            primaryButtonLabel, () => resolve());
        modal.open();
    });
}
