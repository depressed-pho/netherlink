export interface ReadFileOpts {
    /** Default: "arrayBuffer" */
    as?: "arrayBuffer"|"dataURL"|"text";

    /* Makes sense only if "as" is set to "text". */
    encoding?: string
}

export function readFile(file: File, opts : ReadFileOpts & {as: "arrayBuffer"}): Promise<ArrayBuffer>;
export function readFile(file: File, opts : ReadFileOpts & {as: "dataURL"    }): Promise<string>;
export function readFile(file: File, opts : ReadFileOpts & {as: "text"       }): Promise<string>;
export function readFile(file: File, opts?: ReadFileOpts): Promise<ArrayBuffer>;
export function readFile(file: File, opts?: ReadFileOpts): any {
    const o = opts ? opts : {};

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = ev => reject(reader.error);
        reader.onload  = ev => resolve(reader.result);

        switch (o.as || "arrayBuffer") {
            case "arrayBuffer":
                reader.readAsArrayBuffer(file);
                break;

            case "dataURL":
                reader.readAsDataURL(file);
                break;

            case "text":
                reader.readAsText(file, o.encoding);
                break;

            default:
                throw new Error(`unknown reader mode: ${o.as}`);
        }
    });
}
