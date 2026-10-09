export default class ActivityLogMarkup {
  static SETTINGS_HTML = `
    <div class="al-root" style="display:flex; flex-direction:column; gap:18px; max-width:960px;">

      <section class="ext-panel al-controls">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">
          <div>
            <div style="font-size:14px; font-weight:600;">Activity Logging</div>
            <div class="luma-field-help" style="margin-top:4px;">Records timed spans of actions performed by extensions and core services. All writes are off when the master toggle is off, so leaving it disabled costs nothing.</div>
          </div>
          <label class="luma-switch" title="Master enable">
            <input type="checkbox" id="al-master-toggle">
            <span class="luma-switch-track"></span>
          </label>
        </div>

        <div class="ext-form-row-inline" style="display:flex; gap:12px; margin-top:14px; flex-wrap:wrap;">
          <div class="luma-field" style="flex:1; min-width:180px; margin-bottom:0;">
            <label class="luma-field-label">Retention (days)</label>
            <input type="number" min="0" step="1" class="luma-field-input" id="al-retention-days">
            <div class="luma-field-help">Entries older than this are auto-pruned. 0 = keep forever.</div>
          </div>
          <div class="luma-field" style="flex:1; min-width:180px; margin-bottom:0;">
            <label class="luma-field-label">Max entries</label>
            <input type="number" min="0" step="100" class="luma-field-input" id="al-retention-rows">
            <div class="luma-field-help">Oldest entries are dropped once this count is exceeded. 0 = unlimited.</div>
          </div>
        </div>

        <div class="luma-form-actions ext-form-buttons--start ext-mt-12" style="gap:8px;">
          <button class="luma-btn" id="al-refresh-callers-btn">Refresh callers</button>
          <button class="luma-btn danger" id="al-clear-btn" style="margin-left:auto;">Clear all logs</button>
        </div>
        <div id="al-save-status" style="font-size:12px; margin-top:6px; min-height:16px; opacity:0.7;">Changes save automatically.</div>
      </section>

      <section class="ext-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="font-size:13px; font-weight:600;">Per-caller toggles</div>
          <div style="font-size:11px; opacity:0.6;" id="al-caller-count">0 callers</div>
        </div>
        <div class="luma-field-help" style="margin-bottom:10px;">Individual extensions and core services. Toggle off to silence a noisy caller while keeping the rest enabled. Callers appear here automatically when they register with the logger.</div>
        <div id="al-caller-list" class="al-caller-list" style="display:flex; flex-direction:column; gap:6px;"></div>
      </section>

      <section class="ext-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:10px; flex-wrap:wrap;">
          <div style="font-size:13px; font-weight:600;">Log viewer</div>
          <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
            <select id="al-filter-caller" class="luma-field-input" style="font-size:12px; padding:4px 8px; min-width:140px;">
              <option value="">All callers</option>
            </select>
            <select id="al-filter-result" class="luma-field-input" style="font-size:12px; padding:4px 8px;">
              <option value="">All results</option>
              <option value="success">success</option>
              <option value="failure">failure</option>
              <option value="warning">warning</option>
              <option value="info">info</option>
              <option value="in_progress">in_progress</option>
            </select>
            <input type="text" id="al-filter-search" class="luma-field-input" placeholder="Search summary/details"
              style="font-size:12px; padding:4px 8px; width:200px;">
            <button class="luma-btn luma-btn--sm" id="al-refresh-entries-btn">Refresh</button>
          </div>
        </div>

        <div class="al-viewer" style="display:grid; grid-template-columns: minmax(320px, 2fr) minmax(280px, 3fr); gap:12px; min-height:320px;">
          <div class="al-list" id="al-entry-list" style="
              background: var(--surface-sunken);
              border: 1px solid var(--border);
              border-radius: 6px; max-height: 480px; overflow:auto;">
          </div>
          <div class="al-detail" id="al-entry-detail" style="
              background: var(--surface-sunken);
              border: 1px solid var(--border);
              border-radius: 6px; padding:12px; overflow:auto; max-height: 480px;
              font-size: 12px; line-height: 1.55;">
            <div style="opacity:0.5; font-style:italic;">Select an entry to see the full details.</div>
          </div>
        </div>
      </section>
    </div>

    <style>

      .al-caller-row {
        display:flex; align-items:center; gap:10px;
        padding:8px 10px; background: var(--surface-sunken);
        border-radius:6px; border:1px solid var(--border);
      }
      .al-caller-row--disabled { opacity:0.55; }
      .al-caller-row-name { font-weight:600; font-size:13px; }
      .al-caller-row-id { font-family: monospace; font-size:11px; opacity:0.55; margin-left:6px; }
      .al-caller-row-desc { font-size:11px; opacity:0.65; margin-top:2px; }
      .al-caller-row-source {
        font-size:10px; padding:1px 6px; border-radius:10px;
        background: rgba(255,255,255,0.06); opacity:0.7; margin-left:6px;
      }

      .al-entry-row {
        padding:8px 10px; cursor:pointer;
        border-bottom:1px solid var(--border);
        display:flex; align-items:center; gap:8px;
      }
      .al-entry-row:hover { background: rgba(255,255,255,0.03); }
      .al-entry-row--selected { background: var(--accent-soft) !important; }
      .al-entry-time  { font-family: monospace; font-size:10px; opacity:0.55; width:60px; flex-shrink:0; }
      .al-entry-caller { font-size:11px; opacity:0.75; width:120px; flex-shrink:0;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .al-entry-action { font-size:12px; font-weight:500; flex:1;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .al-entry-duration { font-family: monospace; font-size:10px; opacity:0.6; width:55px; text-align:right; }
      .al-entry-result {
        font-size:10px; padding:1px 6px; border-radius:10px; flex-shrink:0;
        font-weight:600; text-transform:uppercase; letter-spacing:0.02em;
      }
      .al-result-success    { background: rgba(74,222,128,0.14);  color: var(--good); }
      .al-result-failure    { background: rgba(248,113,113,0.14); color: var(--bad); }
      .al-result-warning    { background: rgba(251,191,36,0.14);  color: var(--warn); }
      .al-result-info       { background: var(--surface-hover);   color: var(--text-dim); }
      .al-result-in_progress { background: var(--accent-soft);    color: var(--accent); }

      .al-detail pre {
        background: rgba(0,0,0,0.3); padding:8px; border-radius:4px;
        overflow:auto; font-size:11px; max-height:200px;
        white-space: pre-wrap; word-break: break-word;
      }
      .al-detail-section { margin-top:10px; }
      .al-detail-label {
        font-size:10px; text-transform:uppercase; letter-spacing:0.05em;
        opacity:0.55; margin-bottom:3px;
      }
      .al-detail-child {
        margin-left:12px; padding:4px 8px; border-left:2px solid rgba(255,255,255,0.08);
        font-size:11px; margin-bottom:2px;
      }
    </style>
  `;
}
