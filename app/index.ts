import 'foundation-sites';
import $ from 'jquery';
//import { NLStorage } from 'netherlink/storage';
import * as LocalStorage from 'netherlink/storage/local';

$(document).foundation();

window.addEventListener('DOMContentLoaded', (ev) => {
    console.log(LocalStorage.instance.currentWorld);
});
