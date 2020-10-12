import 'foundation-sites';
import $ = require('jquery');
import { WorldEditorModel } from './model/world-editor';
import { WorldSelectorModel } from './model/world-selector';
import { overworld, nether } from 'netherlink/dimension';
import { NLStorage } from 'netherlink/storage';
import * as LocalStorage from 'netherlink/storage/local';
import { WorldSelectorView } from './view/world-selector';
import { PortalListView } from './view/portal-list';

$(document).foundation();

window.addEventListener('DOMContentLoaded', (ev) => {
    const storage: NLStorage = LocalStorage.instance;

    const worldSelM = new WorldSelectorModel(storage);
    const worldSelV = new WorldSelectorView(worldSelM);

    const worldEditM = new WorldEditorModel(worldSelM);
    const owPortalsV = new PortalListView(overworld, worldEditM);
    const ntPortalsV = new PortalListView(nether, worldEditM);
    attach('portalsInOverworld', owPortalsV.fragment);
    attach('portalsInNether', ntPortalsV.fragment);
});

function attach(id: string, frag: DocumentFragment) {
    const parent = document.getElementById(id)!;
    parent.appendChild(frag);
}
