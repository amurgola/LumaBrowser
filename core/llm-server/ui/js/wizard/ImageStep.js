import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import ExistingLibraryView from '../setup/ExistingLibraryView.js';
import ImageModelBudget from '../setup/ImageModelBudget.js';
import ImageRuntimePicker from '../setup/ImageRuntimePicker.js';
import ExistingModelsMarkup from './ExistingModelsMarkup.js';
import ImageSetupFlow from './ImageSetupFlow.js';
import LoadingSteps from './LoadingSteps.js';

export default class ImageStep {
  static STEP = 5;

  static GO_CHAT = '<div class="wz-img-actions"><button class="luma-btn primary luma-btn--block wz-go" data-go-chat type="button">Start chatting</button></div>';

  static EXISTING = { noun: 'image model', open: true, withArch: true, moreText: 'Link the rest later from the Image section.' };

  static render(w, body) {
    const view = w.state.image.view;
    if (view === 'progress') return ImageStep._progress(w, body);
    if (view === 'done') return ImageStep._done(w, body);
    if (view === 'error') return ImageStep._error(w, body);
    return ImageStep._ask(w, body);
  }

  static async _ask(w, body) {
    if (!w.imageApi()) {
      ImageStep._goChatOnly(w, body, '<div class="luma-callout">Image generation isn’t available in this build.</div>');
      return;
    }
    LoadingSteps.mount(body, ['Reading your hardware', 'Choosing an image model', 'Preparing the catalog'], w.timers);
    const { view, catalog } = await ImageStep._load(w.imageApi());
    if (!w.state || w.state.step !== ImageStep.STEP || w.state.image.view !== 'ask') return;
    w.timers.clear();
    if (!view || !catalog || catalog.length === 0) {
      ImageStep._goChatOnly(w, body, '<div class="luma-callout bad">Couldn’t load the image catalog. You can set this up later from the Image tab.</div>');
      return;
    }
    ImageStep._offer(w, body, view, catalog);
  }

  static async _load(api) {
    try {
      const [runtimes, catalog] = await Promise.all([api.getRuntimesView(), api.modelCatalog()]);
      return { view: runtimes && runtimes.view, catalog: (catalog && catalog.models) || [] };
    } catch (_) { return { view: null, catalog: null }; }
  }

  static _goChatOnly(w, body, html) {
    body.innerHTML = html + ImageStep.GO_CHAT;
    body.querySelector('[data-go-chat]').addEventListener('click', () => w.goChat());
  }

  static _offer(w, body, view, catalog) {
    const runtime = ImageRuntimePicker.pick(view);
    const model = ImageModelBudget.pickImageModel(catalog, w.state.hw) || catalog[0];
    w.state.image.rec = { runtime, model };
    w.state.image.found = null;
    body.innerHTML = '';
    const card = Dom.el('div', 'wz-rec');
    card.innerHTML = ImageStep.offerHtml(runtime, model);
    const existing = Dom.el('div', 'wz-existing-host');
    body.appendChild(existing);
    body.appendChild(card);
    if (runtime) ImageStep._mountExisting(w, existing, body);
    card.querySelector('[data-img-go]').addEventListener('click', () => new ImageSetupFlow(w).run());
    card.querySelector('[data-img-skip]').addEventListener('click', () => w.goChat());
  }

  static offerHtml(runtime, model) {
    const esc = HtmlEscaper.escape;
    const total = model.files
      ? Object.keys(model.files).reduce((s, k) => s + ((model.files[k] && model.files[k].approxBytes) || 0), 0)
      : 0;
    const hwNote = runtime && runtime.hardware && !runtime.hardware.ready
      ? `<div class="luma-callout warn">${esc(runtime.hardware.note || 'Selected runtime reports hardware not ready: it may run slowly or fail to start.')}</div>`
      : '';
    return '<div class="wz-rec-head">Add local image generation</div>'
      + '<div class="wz-rec-name">' + esc(model.label || model.id) + '</div>'
      + '<div class="wz-rec-meta">~' + ByteFormatter.gb(total) + ' download · ' + esc(runtime ? runtime.name : 'No compatible runtime') + '</div>'
      + '<p class="wz-rec-why">' + esc(model.blurb || 'Local text-to-image generation. Runs entirely on this machine.') + '</p>'
      + hwNote
      + '<div class="wz-img-actions">'
      + '<button class="luma-btn primary luma-btn--block wz-go" data-img-go type="button">Download &amp; set up</button>'
      + '<button class="luma-btn link wz-back-link" data-img-skip type="button">Skip · start chatting</button>'
      + '</div>';
  }

  static _mountExisting(w, host, body) {
    const api = w.imageApi();
    if (!host || !api || !api.scanExistingLibraries) return;
    api.scanExistingLibraries().then((scan) => {
      if (!w.state || w.state.step !== ImageStep.STEP || w.state.image.view !== 'ask' || !host.isConnected) return;
      const view = ExistingLibraryView.view(scan);
      if (!view.models.length) return;
      host.innerHTML = ExistingModelsMarkup.html(view, ImageStep.EXISTING);
      ExistingModelsMarkup.wire(host, view.shown, (found) => {
        w.state.image.found = found;
        new ImageSetupFlow(w).run();
      });
    }).catch(() => { host.innerHTML = ''; });
  }

  static _progress(w, body) {
    body.innerHTML = '<div class="wz-prog">'
      + '<div class="wz-prog-phase" data-img-phase>Preparing…</div>'
      + '<div class="luma-progress wz-bar" data-img-bar><div class="luma-progress-fill wz-bar-fill" data-img-fill></div></div>'
      + '<div class="wz-prog-sub" data-img-sub></div>'
      + '<button class="luma-btn wz-cancel" data-img-cancel type="button">Cancel</button>'
      + '</div>';
    body.querySelector('[data-img-cancel]').addEventListener('click', () => {
      w.state.image.canceled = true;
      try { w.imageApi().cancelModelDownload(); } catch (_) {}
      const button = body.querySelector('[data-img-cancel]');
      button.disabled = true;
      button.textContent = 'Canceling…';
    });
  }

  static _done(w, body) {
    const rec = w.state.image.rec || {};
    const found = w.state.image.found;
    const name = (found && found.name) || (rec.model && (rec.model.label || rec.model.id)) || 'Image model';
    body.innerHTML = '<div class="wz-done"><div class="wz-done-ic"></div>'
      + '<h2>Image generation ready</h2>'
      + '<p>' + HtmlEscaper.escape(name) + (found ? ' is linked and the image server is running. No download needed.'
        : ' is downloaded and the image server is running.') + '</p>'
      + '<button class="luma-btn primary luma-btn--block wz-go" data-go-chat type="button">Start chatting</button></div>';
    body.querySelector('[data-go-chat]').addEventListener('click', () => w.goChat());
  }

  static _error(w, body) {
    body.innerHTML = '<div class="luma-callout bad">' + HtmlEscaper.escape(w.state.image.error || 'Image setup failed.') + '</div>'
      + '<div class="wz-img-actions">'
      + '<button class="luma-btn primary luma-btn--block wz-go" data-img-retry type="button">Try again</button>'
      + '<button class="luma-btn link wz-back-link" data-go-chat type="button">Skip · start chatting</button>'
      + '</div>';
    body.querySelector('[data-img-retry]').addEventListener('click', () => {
      Object.assign(w.state.image, { view: 'ask', error: null, canceled: false });
      w.render();
    });
    body.querySelector('[data-go-chat]').addEventListener('click', () => w.goChat());
  }
}
