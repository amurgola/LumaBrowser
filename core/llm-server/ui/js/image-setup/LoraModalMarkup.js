import HtmlEscaper from '../format/HtmlEscaper.js';

export default class LoraModalMarkup {
  static html(label, hasPair) {
    return `
      <div class="luma-modal img-modal" role="dialog" aria-labelledby="loraTitle">
        <div class="img-modal-header">
          <h3 class="luma-modal-title" id="loraTitle">LoRAs / speed: ${HtmlEscaper.escape(label)}</h3>
          <button class="luma-icon-btn luma-icon-btn--sq img-modal-x" data-act="close" aria-label="Close">×</button>
        </div>
        <div class="img-modal-body">
          <div class="img-row-sub">Attach an <strong>acceleration LoRA</strong> (DMD2 / SDXL-Lightning / Hyper / MiniMax-H3 Turbo) to run this model in ~8 steps at cfg&nbsp;1: a large speedup with little quality loss. Drop the LoRA's .safetensors into your library, pick it here, and enable the speed preset.</div>
          <div class="lora-curated"></div>
          ${hasPair ? '<div class="img-row-sub"><strong>A LoRA pair is attached</strong> (low + high noise). Saving from the single picker below replaces the whole pair; re-attach it from the curated row above.</div>' : ''}
          <div class="defaults-row">
            <label for="loraSel">LoRA</label>
            <select id="loraSel"><option value="">None</option></select>
            <button class="luma-btn luma-btn--sm" data-act="import-lora">Import…</button>
          </div>
          <div class="img-row-sub lora-base-note" hidden></div>
          <div class="defaults-row">
            <label for="loraWeight">Weight</label>
            <input type="number" id="loraWeight" min="0" max="2" step="0.05" value="1.0" style="max-width:7rem"/>
          </div>
          <label class="luma-check defaults-toggle">
            <input type="checkbox" id="loraPreset"/>
            <span>Apply distilled speed preset (8 steps, cfg&nbsp;1, euler). Enable for DMD2 / Lightning / Hyper / MiniMax-H3 Turbo LoRAs.</span>
          </label>
          <details class="fit-note"><summary>Notes</summary>
            • A LoRA's name is its filename without <code>.safetensors</code>.<br>
            • 4-step LoRAs exist too: after applying, lower steps to 4 in the model's defaults if needed.<br>
            • For an <em>LCM</em> LoRA use cfg ~1.5 and the lcm sampler instead.<br>
            • MiniMax-H3 Turbo: keep weight 1.0; 6–8 steps is the sweet spot (4 works but softer). It was trained against the <em>full</em> H3 checkpoint: on the pruned quant some of its layers are skipped and quality drops.<br>
            • Leaving the LoRA as “None” and saving removes it.<br>
            • Saving reloads this model's server on the next generation so the LoRA takes effect.</details>
        </div>
        <div class="img-modal-footer">
          <span class="fit-note img-modal-err"></span>
          <button class="luma-btn luma-btn--sm" data-act="close">Cancel</button>
          <button class="luma-btn primary luma-btn--sm" data-act="save">Save</button>
        </div>
      </div>`;
  }
}
