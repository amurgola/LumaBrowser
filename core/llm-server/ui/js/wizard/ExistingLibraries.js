import ExistingLibraryView from '../setup/ExistingLibraryView.js';
import ExistingModelsMarkup from './ExistingModelsMarkup.js';
import ImportFlow from './ImportFlow.js';

export default class ExistingLibraries {
  static MARKUP = { noun: 'model', withArch: false, moreText: 'Point your models folder at that library in Setup to use them all.' };

  static mount(wizard, host, recFor) {
    const api = wizard.api();
    if (!host || !api || !api.scanExistingLibraries) return;
    api.scanExistingLibraries().then((scan) => {
      const view = ExistingLibraryView.view(scan);
      if (!view.models.length) { host.innerHTML = ''; return; }
      host.innerHTML = ExistingModelsMarkup.html(view, { ...ExistingLibraries.MARKUP, open: view.expanded });
      ExistingModelsMarkup.wire(host, view.shown, (found) => new ImportFlow(wizard).run(found, recFor()));
    }).catch(() => { host.innerHTML = ''; });
  }
}
