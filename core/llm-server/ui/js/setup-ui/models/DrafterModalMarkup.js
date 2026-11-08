import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class DrafterModalMarkup {
  static AUTO = 'auto';

  static OFF = 'off';

  static MTP = 'mtp';

  static html(view) {
    const esc = HtmlEscaper.escape;
    return `
      <div class="luma-modal img-modal" role="dialog" aria-labelledby="drafterTitle">
        <div class="img-modal-header">
          <h3 class="luma-modal-title" id="drafterTitle">Drafter: ${esc(view.label)}</h3>
          <button class="luma-icon-btn luma-icon-btn--sq img-modal-x" data-act="close" aria-label="Close">×</button>
        </div>
        <div class="img-modal-body">
          <div class="img-row-sub">A <strong>speculative drafter</strong> is a small model that proposes a block of tokens each step for this model to verify: faster replies, same output quality, about 2 to 3 GB more VRAM. Pick one from your library, run without one, or leave it on automatic (the drafter in this model's folder).</div>
          ${DrafterModalMarkup.curatedHtml(view.offer)}
          <div class="defaults-row">
            <label for="drafterSel">Drafter</label>
            <select id="drafterSel">${view.options.map(DrafterModalMarkup._optionHtml).join('')}</select>
          </div>
          <details class="fit-note"><summary>Notes</summary>
            • A drafter must be built for this model (same tokenizer); one made for another model fails to load or drafts nothing.<br>
            • Automatic uses the drafter the scanner paired from this model's folder; without one it falls back to the built-in MTP head, if the weights carry one.<br>
            • A drafter file always wins over the MTP head; pick Built-in MTP head to run MTP instead.<br>
            • None turns speculative decoding off and keeps every file on disk; switch back any time.<br>
            • The change takes effect the next time this model loads.</details>
        </div>
        <div class="img-modal-footer">
          <span class="fit-note img-modal-err"></span>
          <button class="luma-btn luma-btn--sm" data-act="close">Cancel</button>
          <button class="luma-btn primary luma-btn--sm" data-act="save">Save</button>
        </div>
      </div>`;
  }

  static curatedHtml(offer) {
    if (!offer) return '';
    const esc = HtmlEscaper.escape;
    const size = offer.approxBytes ? ` · ${ByteFormatter.bytes(offer.approxBytes)}` : '';
    let button;
    if (offer.installed) button = '<button class="luma-btn luma-btn--sm" disabled>In library</button>';
    else if (!offer.engineSupported) button = '<button class="luma-btn luma-btn--sm" disabled title="Needs a llama.cpp runtime">Needs llama.cpp</button>';
    else button = `<button class="luma-btn luma-btn--sm" data-act="dl-drafter" title="${esc(offer.licenseNote || '')}">Download</button>`;
    return `
          <div class="defaults-row" title="${esc(offer.blurb || '')}">
            <label>${esc(offer.label)}${size}</label>
            ${button}
          </div>`;
  }

  static options(model, library) {
    const choice = model.drafterChoice || DrafterModalMarkup.AUTO;
    const picked = choice === 'file' && model.drafter && model.drafter[0] ? model.drafter[0].path : null;
    return [
      { value: DrafterModalMarkup.AUTO, text: `Automatic: ${DrafterModalMarkup.autoText(model)}`, selected: choice === 'auto' },
      ...(model.mtpCapable ? [{ value: DrafterModalMarkup.MTP, text: 'Built-in MTP head (no drafter file)', selected: choice === 'mtp' }] : []),
      { value: DrafterModalMarkup.OFF, text: 'None: no speculative decoding', selected: choice === 'off' },
      ...(library || []).map((d) => ({ value: d.path, text: DrafterModalMarkup.fileText(d), selected: d.path === picked })),
    ];
  }

  static autoText(model) {
    const auto = Array.isArray(model.drafterAuto) && model.drafterAuto[0] ? model.drafterAuto[0].name : null;
    if (auto) return auto;
    return model.mtpCapable ? 'built-in MTP head' : 'none in this folder';
  }

  static fileText(d) {
    const bits = [d.name, ByteFormatter.bytes(d.sizeBytes || 0)];
    if (d.blockSize) bits.push(`block ${d.blockSize}`);
    bits.push(DrafterModalMarkup.folderText(d.relativeDirectory));
    return bits.join(' · ');
  }

  static folderText(rel) {
    const dir = String(rel || '').trim();
    return !dir || dir === '.' ? 'models folder' : dir;
  }

  static _optionHtml(o) {
    const esc = HtmlEscaper.escape;
    return `<option value="${esc(o.value)}"${o.selected ? ' selected' : ''}>${esc(o.text)}</option>`;
  }
}
