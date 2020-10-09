export function parseHTML(src: string, ctx = document): DocumentFragment {
    /* We want to use Element#insertAdjacentHTML but since it isn't a
     * method of Node we need to create a temporary element as a
     * wrapper. */
    const tmp = ctx.createElement("div");
    tmp.insertAdjacentHTML('afterbegin', src);

    /* Then transplant its nodes to a fragment. */
    const frag = ctx.createDocumentFragment();
    for (const node of tmp.childNodes) {
        /* It may be costly to deep-clone the node, but it doesn't
         * work without it. */
        frag.appendChild(node.cloneNode(true));
    }

    return frag;
}
