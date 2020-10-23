import 'foundation-sites';
import $ = require('jquery');
import htmlAlert from './alert.html';

export type AlertClass = ""|"secondary"|"primary"|"success"|"warning"|"alert";

class AlertView {
    private readonly divAlertContainer: HTMLDivElement;
    private readonly tmplAlert: HTMLTemplateElement;
    private readonly frag: DocumentFragment;

    public constructor(aClass: AlertClass, title: string, message: string) {
        if (!document.getElementById("alerts")) {
            const parent = document.querySelector("div.nl-alert-parent")!;
            parent.insertAdjacentHTML("beforeend", htmlAlert);
        }

        this.divAlertContainer = document.getElementById("alerts")! as HTMLDivElement;
        this.tmplAlert         = this.divAlertContainer.querySelector("template")! as HTMLTemplateElement;
        this.frag              = this.tmplAlert.content.cloneNode(true) as DocumentFragment;

        const divAlert = this.frag.querySelector("div.callout")! as HTMLDivElement;
        divAlert.classList.add(aClass);

        const hTitle = this.frag.querySelector("*[data-for='title']")! as HTMLHeadingElement;
        hTitle.textContent = title;

        const pMsg = this.frag.querySelector("p[data-for='message']")! as HTMLParagraphElement;
        pMsg.textContent = message;
    }

    public show(): void {
        this.divAlertContainer.appendChild(this.frag);
        $(this.divAlertContainer).foundation();
    }
}

export function show(aClass: AlertClass, title: string, message: string) {
    const alert = new AlertView(aClass, title, message);
    alert.show();
}
