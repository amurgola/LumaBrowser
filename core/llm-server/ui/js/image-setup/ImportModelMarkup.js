export default class ImportModelMarkup {
  static HTML = `
      <div class="luma-modal img-modal" role="dialog" aria-labelledby="imgImportTitle">
        <div class="img-modal-header">
          <h3 class="luma-modal-title" id="imgImportTitle">Import custom image model</h3>
          <button class="luma-icon-btn luma-icon-btn--sq img-modal-x" data-act="close" aria-label="Close">×</button>
        </div>
        <div class="img-modal-body">
          <div class="defaults-row">
            <label for="impName">Display name</label>
            <input type="text" id="impName" placeholder="e.g. Pony Diffusion V6 XL" autocomplete="off"/>
          </div>
          <div class="defaults-row">
            <label for="impBase">Base architecture</label>
            <select id="impBase">
              <option value="sdxl">SDXL: for SDXL fine-tunes (Pony, Juggernaut, RealVis…)</option>
              <option value="sd-1-5">SD 1.5: for older fine-tunes</option>
              <option value="flux">Flux: for Flux fine-tunes (GGUF UNet only)</option>
              <option value="qwen-image-edit">Qwen-Image-Edit: edit model / all-in-one (e.g. Rapid AIO)</option>
              <option value="qwen-image-2-1">Qwen-Image 2.1: generate + edit (GGUF, reuses the installed 2.1 encoder + VAE)</option>
              <option value="anima">Anima (CircleStone Cosmos): split UNet only, NOT for SDXL anime checkpoints</option>
            </select>
          </div>
          <div class="defaults-row" id="impStyleRow" hidden>
            <label for="impStyle">Prompt style</label>
            <select id="impStyle"></select>
          </div>
          <div class="img-row-sub" id="impStyleNote" hidden>Teaches the chat AI how to write prompts for this model (booru tags vs natural language) and sets a sensible default negative prompt.</div>
          <details class="fit-note" id="impQwenNote" hidden>
            <summary>About Qwen-Image-Edit checkpoints</summary>
            Qwen-Image-Edit checkpoints (incl. Rapid AIO) load as a diffusion model + the
            VAE / Qwen2.5-VL text encoder / mmproj reused from your installed
            <strong>Qwen-Image-Edit 2509</strong> (install it first). Large FP8 checkpoints are
            quantized to q4_K on load so they fit: the first load takes a few minutes, then it's fast.
          </details>
          <details class="fit-note" id="impAnimaNote" hidden>
            <summary>About Anima checkpoints</summary>
            This is <strong>only</strong> for CircleStone Labs <strong>Anima</strong> (the
            Cosmos-Predict2 model): a split model where you pick the diffusion
            <strong>.safetensors</strong> only (the UNet), and its Qwen-Image VAE + Qwen3 text
            encoder are reused from your installed Anima (download it once from the catalog first).
            <br><br>
            Despite the name, an <em>anime</em> SDXL/Pony/Illustrious checkpoint (even one with
            "anima" in its filename) is <strong>not</strong> this: those bake in their own VAE,
            so import them as <strong>SDXL</strong> instead.
          </details>
          <div class="img-modal-tabs luma-tabs">
            <button type="button" class="active" data-tab="url">From URL</button>
            <button type="button" data-tab="file">From local file</button>
          </div>
          <div class="img-modal-tab-body" data-tab="url">
            <div class="defaults-row">
              <label for="impUrl">Direct file URL</label>
              <input type="url" id="impUrl" placeholder="https://huggingface.co/.../resolve/main/model.safetensors" autocomplete="off"/>
            </div>
            <details class="fit-note"><summary>Two ways to paste</summary>
              - A <strong>model page</strong> URL like <code>https://huggingface.co/circlestone-labs/Anima</code>: the newest base + its VAE / text-encoder download automatically (display name &amp; base architecture are detected).<br>
              - A <strong>direct file</strong> URL (<code>/resolve/main/…</code>, not <code>/blob/main/…</code>) ending in .safetensors / .ckpt / .gguf: fill in the display name &amp; base architecture above.</details>
          </div>
          <div class="img-modal-tab-body" data-tab="file" hidden>
            <div class="defaults-row">
              <label>Local file</label>
              <span class="img-file-display"><span class="img-file-name">No file picked yet</span></span>
              <button class="luma-btn luma-btn--sm" data-act="pick-file">Pick file…</button>
            </div>
            <details class="fit-note"><summary>More info</summary>The file will be copied into the models directory so the original location can be safely deleted.</details>
          </div>
        </div>
        <div class="img-modal-footer">
          <span class="fit-note img-modal-err"></span>
          <button class="luma-btn luma-btn--sm" data-act="close">Cancel</button>
          <button class="luma-btn primary luma-btn--sm" data-act="submit">Import</button>
        </div>
      </div>
    `;
}
