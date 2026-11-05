export default class CivitaiModalMarkup {
  static EMPTY_DETAIL = '<div class="ms-detail ms-empty-detail">'
    + 'Search CivitAI on the left, or paste a model page URL, then pick a model to see its page, versions and install it.</div>';

  static HTML = `
      <div class="luma-modal ms-modal img-civ-modal" role="dialog" aria-labelledby="imgCivTitle">
        <div class="ms-head">
          <div class="ms-title luma-modal-title" id="imgCivTitle">Browse CivitAI <span class="ms-sub">CivitAI · Checkpoints</span></div>
          <button class="luma-icon-btn luma-icon-btn--sq ms-x" data-act="close" title="Close" aria-label="Close">✕</button>
        </div>
        <div class="ms-body">
          <div class="ms-left">
            <div class="ms-search-bar">
              <input class="ms-search-in" id="civQuery" type="text" placeholder="Search models, or paste a CivitAI URL…" autocomplete="off" spellcheck="false"/>
              <select class="ms-sort" id="civSort" title="Order results by"></select>
            </div>
            <div class="ms-search-bar ms-toggles">
              <select class="ms-sort" id="civType" title="Asset type"></select>
              <select class="ms-sort" id="civBase" title="Base model"></select>
              <label class="ms-mlx-toggle" title="Include adult-rated models and sample images"><input type="checkbox" id="civNsfw"/> Adult</label>
            </div>
            <div class="ms-status" data-civ="status"></div>
            <div class="ms-status ms-error img-modal-err"></div>
            <div class="ms-results" data-civ="results"></div>
            <div class="ms-more" data-civ="more" hidden><button class="luma-btn luma-btn--sm" data-act="more">Load more</button></div>
            <details class="ms-key">
              <summary>CivitAI API key <span class="ms-dim" data-civ="key-state"></span></summary>
              <div class="ms-search-bar ms-key-row">
                <input class="ms-search-in" id="civToken" type="password" placeholder="Paste an API key from civitai.com/user/account" autocomplete="off"/>
                <button class="luma-btn luma-btn--sm" data-act="save-key">Save</button>
                <button class="luma-btn luma-btn--sm" data-act="clear-key">Clear</button>
              </div>
              <div class="ms-dim ms-key-note">Only needed for early-access or login-gated downloads. The key stays on this machine and is sent to civitai.com only.</div>
            </details>
          </div>
          <div class="ms-right" data-civ="detail">${CivitaiModalMarkup.EMPTY_DETAIL}</div>
        </div>
      </div>
    `;
}
