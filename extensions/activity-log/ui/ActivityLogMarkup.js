export default class ActivityLogMarkup {
  static SETTINGS_HTML = `
    <div class="al-root">

      <section class="al-section al-controls">
        <div class="al-head">
          <div>
            <div class="al-title">Activity logging</div>
            <div class="luma-field-help al-lead">Records timed spans of actions performed by extensions and core services. All writes are off when the master toggle is off, so leaving it disabled costs nothing.</div>
          </div>
          <label class="luma-switch" title="Master enable">
            <input type="checkbox" id="al-master-toggle">
            <span class="luma-switch-track"></span>
          </label>
        </div>

        <div class="ext-form-row-inline al-retention">
          <div class="luma-field al-retention-field">
            <label class="luma-field-label">Retention (days)</label>
            <input type="number" min="0" step="1" class="luma-field-input" id="al-retention-days">
            <div class="luma-field-help">Entries older than this are pruned automatically. 0 keeps them forever.</div>
          </div>
          <div class="luma-field al-retention-field">
            <label class="luma-field-label">Max entries</label>
            <input type="number" min="0" step="100" class="luma-field-input" id="al-retention-rows">
            <div class="luma-field-help">The oldest entries are dropped once this count is exceeded. 0 is unlimited.</div>
          </div>
        </div>

        <div class="luma-form-actions ext-form-buttons--start ext-mt-12 al-actions">
          <button class="luma-btn" id="al-refresh-callers-btn">Refresh callers</button>
          <button class="luma-btn danger al-push-right" id="al-clear-btn">Clear all logs</button>
        </div>
        <div id="al-save-status" class="al-save-status">Changes save automatically.</div>
      </section>

      <section class="al-section">
        <div class="al-head">
          <div class="al-title">Per-caller toggles</div>
          <div class="al-count" id="al-caller-count">0 callers</div>
        </div>
        <div class="luma-field-help al-lead al-lead--gap">Individual extensions and core services. Turn one off to silence a noisy caller while keeping the rest enabled. Callers appear here automatically when they register with the logger.</div>
        <div id="al-caller-list" class="al-caller-list"></div>
      </section>

      <section class="al-section">
        <div class="al-head al-head--gap">
          <div class="al-title">Log viewer</div>
          <div class="al-filters">
            <select id="al-filter-caller" class="luma-field-input al-filter al-filter--caller">
              <option value="">All callers</option>
            </select>
            <select id="al-filter-result" class="luma-field-input al-filter">
              <option value="">All results</option>
              <option value="success">success</option>
              <option value="failure">failure</option>
              <option value="warning">warning</option>
              <option value="info">info</option>
              <option value="in_progress">in_progress</option>
            </select>
            <input type="text" id="al-filter-search" class="luma-field-input al-filter al-filter--search" placeholder="Search summary or details">
            <button class="luma-btn luma-btn--sm" id="al-refresh-entries-btn">Refresh</button>
          </div>
        </div>

        <div class="al-viewer">
          <div class="al-list" id="al-entry-list"></div>
          <div class="al-detail" id="al-entry-detail">
            <div class="al-placeholder">Select an entry to see the full details.</div>
          </div>
        </div>
      </section>
    </div>

    <style>
      .al-root { display: flex; flex-direction: column; gap: var(--space-6); max-width: 960px; }
      .al-section + .al-section { padding-top: var(--space-6); border-top: 1px solid var(--border-soft); }
      .al-head { display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
      .al-head--gap { margin-bottom: var(--space-3); }
      .al-title { font-size: var(--text-lg); font-weight: var(--weight-semibold); color: var(--text-primary); }
      .al-lead { margin-top: var(--space-1); }
      .al-lead--gap { margin-bottom: var(--space-3); }
      .al-count { font-size: var(--text-xs); color: var(--text-muted); }

      .al-retention { display: flex; gap: var(--space-3); margin-top: var(--space-4); flex-wrap: wrap; }
      .al-retention-field { flex: 1; min-width: 180px; margin-bottom: 0; }
      .al-actions { gap: var(--space-2); }
      .al-push-right { margin-left: auto; }
      .al-save-status { min-height: 16px; margin-top: var(--space-2); font-size: var(--text-sm); color: var(--text-secondary); }

      .al-filters { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
      .al-filters .al-filter { width: auto; height: 28px; padding: 0 var(--space-2); font-size: var(--text-sm); }
      .al-filters .al-filter--caller { min-width: 140px; }
      .al-filters .al-filter--search { width: 200px; }

      .al-viewer { display: grid; grid-template-columns: minmax(320px, 2fr) minmax(280px, 3fr); gap: var(--space-3); min-height: 320px; }
      .al-list,
      .al-detail {
        max-height: 480px;
        overflow: auto;
        border: 1px solid var(--border-soft);
        border-radius: var(--radius-lg);
      }
      .al-detail { padding: var(--space-3); font-size: var(--text-sm); line-height: var(--leading); }
      .al-placeholder { color: var(--text-muted); }
      .al-empty-pad { padding: var(--space-5); text-align: center; }

      .al-caller-list { display: flex; flex-direction: column; }
      .al-caller-row {
        display: flex; align-items: center; gap: var(--space-3);
        padding: var(--space-2) 0;
        border-top: 1px solid var(--border-soft);
      }
      .al-caller-row:first-child { border-top: 0; }
      .al-caller-row--disabled { opacity: 0.55; }
      .al-caller-row-main { flex: 1; min-width: 0; }
      .al-caller-row-name { font-size: var(--text-md); font-weight: var(--weight-medium); color: var(--text-primary); }
      .al-caller-row-id { margin-left: var(--space-2); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-muted); }
      .al-caller-row-desc { margin-top: 2px; font-size: var(--text-sm); color: var(--text-secondary); }
      .al-caller-row-source {
        margin-left: var(--space-2); padding: 1px 6px; border-radius: var(--radius-sm);
        background: var(--bg-surface-2); color: var(--text-secondary); font-size: var(--text-xs);
      }
      .al-caller-row-source:empty { display: none; }

      .al-entry-row {
        display: flex; align-items: center; gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        border-bottom: 1px solid var(--border-soft);
        cursor: pointer;
        transition: background-color var(--dur-fast) var(--ease);
      }
      .al-entry-row:hover { background: var(--surface-hover); }
      .al-entry-row--selected,
      .al-entry-row--selected:hover { background: var(--bg-surface-2); }
      .al-entry-time { width: 64px; flex-shrink: 0; font-size: var(--text-xs); font-variant-numeric: tabular-nums; color: var(--text-muted); }
      .al-entry-caller {
        width: 96px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        font-size: var(--text-xs); color: var(--text-secondary);
      }
      .al-entry-action {
        flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        font-size: var(--text-sm); color: var(--text-primary);
      }
      .al-entry-duration { width: 56px; text-align: right; font-size: var(--text-xs); font-variant-numeric: tabular-nums; color: var(--text-muted); }
      .al-entry-result {
        flex-shrink: 0; padding: 1px 6px; border-radius: var(--radius-sm);
        background: var(--bg-surface-2); color: var(--text-secondary);
        font-size: var(--text-xs); font-weight: var(--weight-medium);
      }
      .al-result-failure { background: var(--danger-dim); color: var(--danger); }
      .al-result-warning { background: var(--warning-dim); color: var(--warning); }

      .al-detail-head { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); }
      .al-detail-title { font-size: var(--text-md); font-weight: var(--weight-semibold); color: var(--text-primary); }
      .al-detail-meta { font-size: var(--text-sm); color: var(--text-secondary); }
      .al-detail-mono { font-family: var(--font-mono); font-size: var(--text-xs); word-break: break-all; }
      .al-detail pre {
        max-height: 200px; overflow: auto; padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-md); background: var(--code-bg);
        font-family: var(--font-mono); font-size: var(--text-xs);
        white-space: pre-wrap; word-break: break-word;
      }
      .al-detail-section { margin-top: var(--space-3); }
      .al-detail-label { margin-bottom: 2px; font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--text-secondary); }
      .al-detail-child { margin-bottom: 2px; padding: var(--space-1) 0; border-top: 1px solid var(--border-soft); font-size: var(--text-sm); }
      .al-detail-child:first-of-type { border-top: 0; }
      .al-detail-child .al-entry-result { margin-right: var(--space-2); }
      .al-detail-child-dur { font-variant-numeric: tabular-nums; color: var(--text-muted); }
      .al-detail-child-summary { margin-top: 2px; color: var(--text-secondary); }
    </style>
  `;
}
