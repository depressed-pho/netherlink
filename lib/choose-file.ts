/** Based on https://github.com/f-mer/open-file-dialog but uses
 * Promise.
 */

export interface ChooseFileOpts {
    multiple?: boolean;
    accept?: string[];
}

/** Resolves with a FileList (if "multiple" is true), or a File when a
 * file is chosen. The promise will never be rejected even if the user
 * cancels it, because there is simply no means to detect cancels.
 */
export function chooseFile(opts : ChooseFileOpts & {multiple: true}): Promise<FileList>;
export function chooseFile(opts?: ChooseFileOpts): Promise<File>;
export function chooseFile(opts?: ChooseFileOpts): any {
    const o = opts ? opts : {};

    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        if (o.multiple) {
            input.setAttribute("multiple", "");
        }
        if (o.accept) {
            input.setAttribute("accept", o.accept.join(" "));
        }
        input.style.setProperty("display", "none");
        input.addEventListener("change", ev => {
            resolve(o.multiple ? input.files! : input.files![0]);
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
        });
        document.body.appendChild(input);

        const ev = new MouseEvent("click");
        input.dispatchEvent(ev);
    });
}
