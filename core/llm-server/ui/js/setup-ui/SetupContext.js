import DefaultsPrefs from './defaults/DefaultsPrefs.js';
import DefaultsRows from './defaults/DefaultsRows.js';
import HostCaps from './diagnostics/HostCaps.js';
import FrameworkStore from './frameworks/FrameworkStore.js';
import CtxFitStore from './models/CtxFitStore.js';
import ModelLibrary from './models/ModelLibrary.js';
import RuntimeStatusStore from './runtimes/RuntimeStatusStore.js';

export default class SetupContext {
  constructor({ api, doc = document, win = window }) {
    this.api = api || null;
    this.doc = doc;
    this.win = win;
    this.runtimes = new RuntimeStatusStore();
    this.frameworks = new FrameworkStore();
    this.hostCaps = new HostCaps();
    this.ctxFit = new CtxFitStore(this.api);
    this.library = new ModelLibrary();
    this.prefs = new DefaultsPrefs();
    this.rows = new DefaultsRows();
    this.lastDefaults = null;
    this.cards = {};
    this.refreshLibrary = () => {};
  }
}
