import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import ChatIcons from '../chat/ChatIcons.js';

export default class LoraModalMarkup {
  static NONE_ATTACHED = '<div class="img-row-sub lora-none">No LoRA attached. Add one below.</div>';

  static html(label) {
    return `
      <div class="luma-modal img-modal" role="dialog" aria-labelledby="loraTitle">
        <div class="img-modal-header">
          <h3 class="luma-modal-title" id="loraTitle">LoRAs / speed: ${HtmlEscaper.escape(label)}</h3>
          <button class="luma-icon-btn luma-icon-btn--sq img-modal-x" data-act="close" aria-label="Close">${ChatIcons.x}</button>
        </div>
        <div class="img-modal-body">
          <div class="img-row-sub">Attach any number of LoRAs: styles, characters and concepts stack, each at its own weight. An <strong>acceleration LoRA</strong> (DMD2 / SDXL-Lightning / Hyper / MiniMax-H3 Turbo) runs this model in ~8 steps at cfg&nbsp;1 with the speed preset below.</div>
          <div class="lora-curated"></div>
          <div class="luma-section-label">Attached</div>
          <div class="lora-attached"></div>
          <div class="defaults-row">
            <label for="loraAdd">Add a LoRA</label>
            <select id="loraAdd"><option value="">Choose from your library…</option></select>
          </div>
          <div class="lora-add-actions">
            <button class="luma-btn luma-btn--sm" data-act="import-lora">Import a file…</button>
            <button class="luma-btn luma-btn--sm" data-act="browse-civitai">Browse CivitAI</button>
          </div>
          <label class="luma-check defaults-toggle">
            <input type="checkbox" id="loraPreset"/>
            <span>Apply distilled speed preset (8 steps, cfg&nbsp;1, euler). Enable for DMD2 / Lightning / Hyper / MiniMax-H3 Turbo LoRAs.</span>
          </label>
          <details class="fit-note"><summary>Notes</summary>
            • A LoRA's name is its filename without <code>.safetensors</code>.<br>
            • A LoRA with trigger words only takes effect when the prompt carries them.<br>
            • Stacked LoRAs add up: when the picture breaks, lower the weights (0.6 to 0.8 each is a common start).<br>
            • 4-step LoRAs exist too: after applying, lower steps to 4 in the model's defaults if needed.<br>
            • For an <em>LCM</em> LoRA use cfg ~1.5 and the lcm sampler instead.<br>
            • MiniMax-H3 Turbo: keep weight 1.0; 6–8 steps is the sweet spot (4 works but softer). It was trained against the <em>full</em> H3 checkpoint: on the pruned quant some of its layers are skipped and quality drops.<br>
            • Removing every LoRA and saving detaches them all.<br>
            • Saving reloads this model's server on the next generation so the LoRAs take effect.</details>
        </div>
        <div class="img-modal-footer">
          <span class="fit-note img-modal-err"></span>
          <button class="luma-btn luma-btn--sm" data-act="close">Cancel</button>
          <button class="luma-btn primary luma-btn--sm" data-act="save">Save</button>
        </div>
      </div>`;
  }

  static attachedHtml(rows) {
    if (!rows.length) return LoraModalMarkup.NONE_ATTACHED;
    return rows.map((row, index) => LoraModalMarkup._rowHtml(row, index)).join('');
  }

  static _rowHtml(row, index) {
    const esc = HtmlEscaper.escape;
    const expert = row.highNoise ? ' <span class="luma-chip">high noise</span>' : '';
    const note = row.note && row.note.text ? `<div class="img-row-sub lora-base-note${row.note.warn ? ' bad' : ''}">${esc(row.note.text)}</div>` : '';
    return `
          <div class="lora-item">
            <div class="defaults-row lora-row" data-lora-index="${index}">
              <label title="${esc(row.title)}">${esc(row.title)}${expert}</label>
              <input type="number" class="lora-weight" min="0" max="2" step="0.05" value="${esc(String(row.weight))}" style="max-width:7rem" title="Weight" aria-label="Weight of ${esc(row.title)}"/>
              <button class="luma-btn luma-btn--sm" data-act="remove-lora">Remove</button>
            </div>${note}
          </div>`;
  }

  static addOptionsHtml(groups) {
    const options = (loras) => loras.map((lora) => LoraModalMarkup._optionHtml(lora)).join('');
    const filled = groups.filter((group) => group.loras.length);
    const body = filled.length === 1 && !filled[0].label
      ? options(filled[0].loras)
      : filled.map((group) => `<optgroup label="${HtmlEscaper.escape(group.label)}">${options(group.loras)}</optgroup>`).join('');
    return `<option value="">${filled.length ? 'Choose from your library…' : 'Nothing left to add'}</option>${body}`;
  }

  static _optionHtml(lora) {
    const esc = HtmlEscaper.escape;
    const base = lora.base && lora.base.label ? ` · ${esc(lora.base.label)}` : '';
    return `<option value="${esc(lora.name)}">${esc(lora.label || lora.name)} · ${ByteFormatter.bytes(lora.bytes || 0)}${base}</option>`;
  }
}
