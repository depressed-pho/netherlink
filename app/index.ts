import 'foundation-sites';
import $ = require('jquery');
import { WorldSelectorModel } from './model/world-selector';
import { NLStorage } from 'netherlink/storage';
import * as LocalStorage from 'netherlink/storage/local';
import { WorldSelectorView } from './view/world-selector';

$(document).foundation();

window.addEventListener('DOMContentLoaded', (ev) => {
    const storage: NLStorage = LocalStorage.instance;

    const worldSelM = new WorldSelectorModel(storage);
    const worldSelV = new WorldSelectorView(worldSelM);
});
