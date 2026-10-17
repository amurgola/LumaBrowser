export default class HubWidgetStyles {
  static STYLE_ID = 'hub-widget-styles';

  static CSS = `
.hub-widget {
  --hub-text: var(--text-primary); --hub-dim: var(--text-secondary); --hub-muted: var(--text-muted);
  --hub-border: var(--border-soft); --hub-border-strong: var(--border-strong);
  --hub-sunken: var(--surface-sunken); --hub-hover: var(--surface-hover); --hub-active: var(--surface-active);
  --hub-input: var(--bg-surface-2); --hub-pop: var(--surface-pop); --hub-raised: var(--bg-surface-2); --hub-selected: var(--bg-elevated);
  --hub-accent: var(--accent); --hub-accent-soft: var(--accent-dim); --hub-on-accent: var(--on-accent);
  --hub-good: var(--success); --hub-warn: var(--warning); --hub-bad: var(--danger);
  --hub-fast: var(--dur-fast) var(--ease);
  position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 0;
  font-family: var(--font-sans); font-size: var(--text-md); line-height: var(--leading); color: var(--hub-text); box-sizing: border-box; }
.cm-live-root.hub-widget { background: transparent; color: var(--hub-text); padding: 0; }
.hub-widget *, .hub-widget *::before, .hub-widget *::after { box-sizing: border-box; }
.hub-widget ::-webkit-scrollbar { width: 8px; height: 8px; }
.hub-widget ::-webkit-scrollbar-thumb { background: var(--hub-border-strong); border-radius: var(--radius-pill); border: 2px solid transparent; background-clip: content-box; }
.hub-widget ::-webkit-scrollbar-track { background: transparent; }
.hub-widget button:focus-visible { outline: none; box-shadow: var(--focus-ring); }

.hub-head { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4) var(--space-2); border-bottom: 1px solid var(--hub-border); flex: 0 0 auto; flex-wrap: wrap; }
.hub-title { font-weight: var(--weight-semibold); font-size: var(--text-md); margin: 0; flex: 0 0 auto; color: var(--hub-text); }
.hub-sub { color: var(--hub-dim); font-size: var(--text-sm); }
.hub-spacer { flex: 1; }
.hub-chips { display: flex; flex-wrap: wrap; gap: 2px; min-width: 0; }
.hub-chip { display: inline-flex; align-items: center; gap: 6px; height: 24px; border: 0; background: transparent; color: var(--hub-dim);
  border-radius: var(--radius-sm); padding: 0 var(--space-2); font: inherit; font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer;
  transition: color var(--hub-fast), background-color var(--hub-fast); }
.hub-chip:hover { color: var(--hub-text); background: var(--hub-hover); }
.hub-chip.is-on { background: var(--hub-selected); color: var(--hub-text); }
.hub-chip-n { font-variant-numeric: tabular-nums; font-size: var(--text-xs); font-weight: var(--weight-regular); color: var(--hub-muted); }
.hub-chip.is-on .hub-chip-n { color: var(--hub-dim); }
.hub-sources:not(:empty) { padding: 2px; border-radius: var(--radius-md); background: var(--bg-surface); border: 1px solid var(--hub-border); }
.hub-swatch { display: inline-block; width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; }
.hub-toggle { display: inline-flex; align-items: center; gap: 6px; height: 24px; border: 1px solid var(--hub-border); background: transparent;
  color: var(--hub-dim); border-radius: var(--radius-md); padding: 0 var(--space-2); font: inherit; font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer;
  transition: color var(--hub-fast), background-color var(--hub-fast); }
.hub-toggle:hover { color: var(--hub-text); background: var(--hub-hover); }
.hub-toggle.is-on { color: var(--hub-text); border-color: var(--hub-accent); background: var(--hub-accent-soft); }
.hub-toggle svg { width: 14px; height: 14px; }
.hub-seg { display: inline-flex; gap: 2px; padding: 2px; border: 1px solid var(--hub-border); border-radius: var(--radius-md); background: var(--bg-surface); }
.hub-seg button { border: 0; background: transparent; color: var(--hub-dim); font: inherit; font-size: var(--text-sm); font-weight: var(--weight-medium); height: 22px;
  padding: 0 var(--space-2); cursor: pointer; border-radius: var(--radius-sm); transition: color var(--hub-fast), background-color var(--hub-fast); }
.hub-seg button:hover { color: var(--hub-text); }
.hub-seg button.is-on { background: var(--hub-selected); color: var(--hub-text); }
.hub-body { flex: 1; min-height: 0; overflow: auto; }
.hub-error { color: var(--hub-bad); font-size: var(--text-sm); padding: 6px var(--space-4); }
.hub-error:empty { display: none; }
.hub-attention { display: flex; flex-direction: column; gap: var(--space-1); padding: 6px var(--space-4); border-bottom: 1px solid var(--hub-border); flex: 0 0 auto;
  background: var(--danger-dim); }
.hub-attention:empty { display: none; }
.hub-attention-row { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--hub-text); }
.hub-attention-row .hub-dot { background: var(--hub-bad); }
.hub-attention-row.is-warn { color: var(--hub-dim); }
.hub-attention-row.is-warn .hub-dot { background: var(--hub-warn); }
.hub-attention-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hub-empty { color: var(--hub-dim); padding: var(--space-6) var(--space-4); text-align: center; font-size: var(--text-sm); }
.hub-badge { display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; border-radius: var(--radius-sm); padding: 0 6px; font-size: var(--text-xs);
  font-weight: var(--weight-medium); line-height: 18px; background: var(--hub-active); color: var(--hub-dim); white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
/* App tag in the conversation queue: neutral, with the app's own color as a small dot. */
.hub-badge.hub-app::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--hub-app, var(--hub-muted)); flex: 0 0 auto; }
/* Counts are plain meta text, not pills. */
.hub-count { display: inline-block; font-size: var(--text-xs); font-weight: var(--weight-regular); color: var(--hub-muted); font-variant-numeric: tabular-nums; }
.hub-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--hub-muted); flex: 0 0 auto; }
.hub-dot.p-urgent { background: var(--hub-bad); } .hub-dot.p-high { background: var(--hub-warn); }
.hub-dot.p-normal { background: var(--hub-dim); } .hub-dot.p-low { background: var(--hub-border-strong); }
.hub-prio { font-size: var(--text-xs); font-weight: var(--weight-medium); border-radius: var(--radius-sm); padding: 0 6px; line-height: 18px; background: var(--hub-active); color: var(--hub-dim); }
.hub-prio::first-letter { text-transform: uppercase; }
.hub-prio.p-urgent { background: var(--danger-dim); color: var(--hub-bad); } .hub-prio.p-high { background: var(--warning-dim); color: var(--hub-warn); }
.hub-btn { display: inline-flex; align-items: center; gap: 6px; height: 28px; border: 1px solid var(--hub-border); background: var(--hub-raised); color: var(--hub-text);
  border-radius: var(--radius-md); padding: 0 var(--space-3); font: inherit; font-size: var(--text-sm); font-weight: var(--weight-medium); cursor: pointer; white-space: nowrap;
  transition: background-color var(--hub-fast), color var(--hub-fast); }
.hub-btn:hover { background: var(--hub-selected); }
.hub-btn.hub-primary { background: var(--hub-accent); border-color: transparent; color: var(--hub-on-accent); }
.hub-btn.hub-primary:hover { background: var(--accent-hover); }
.hub-btn:disabled { opacity: 0.5; cursor: default; }
.hub-btn svg { width: 14px; height: 14px; }
.hub-link { color: var(--hub-text); cursor: pointer; text-decoration: underline; text-decoration-color: var(--hub-border-strong); text-underline-offset: 2px; }
.hub-link:hover { text-decoration-color: currentColor; }
/* Tracker status: a neutral tag with the tracker's own color as a dot. */
.hub-status { display: inline-flex; align-items: center; gap: 5px; max-width: 100%; border-radius: var(--radius-sm); padding: 0 6px; line-height: 18px;
  font-size: var(--text-xs); font-weight: var(--weight-medium); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--hub-text); background: var(--hub-active); }
.hub-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--hub-status, var(--hub-muted)); flex: 0 0 auto; }
.hub-avatars { display: inline-flex; }
.hub-avatar { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%;
  font-size: 9px; font-weight: var(--weight-semibold); color: var(--hub-text); background: var(--hub-selected); border: 1.5px solid var(--hub-raised); }
.hub-avatar + .hub-avatar { margin-left: -4px; }

/* board */
.hub-lanes { display: flex; gap: var(--space-3); padding: var(--space-3) var(--space-4) var(--space-4); height: 100%; min-height: 0; overflow-x: auto; overflow-y: hidden; }
.hub-lane { flex: 1 1 240px; min-width: 240px; display: flex; flex-direction: column; min-height: 0; background: var(--hub-sunken);
  border-radius: var(--radius-lg); border: 1px solid transparent; transition: border-color var(--hub-fast), background-color var(--hub-fast); }
.hub-lane.is-over { border-color: var(--hub-accent); background: var(--hub-accent-soft); }
.hub-lane-head { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); font-weight: var(--weight-semibold);
  font-size: var(--text-sm); color: var(--hub-text); }
.hub-lane.is-done .hub-lane-head::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--hub-good); }
.hub-lane-head .hub-spacer { flex: 1; }
.hub-lane-action { border: 0; background: transparent; color: var(--hub-muted); font: inherit; font-size: var(--text-xs); font-weight: var(--weight-medium);
  cursor: pointer; height: 22px; padding: 0 6px; border-radius: var(--radius-md); transition: color var(--hub-fast), background-color var(--hub-fast); }
.hub-lane-action:hover { color: var(--hub-text); background: var(--hub-hover); }
.hub-lane-add { padding: 0 var(--space-2) var(--space-2); }
.hub-lane-add input { width: 100%; border: 1px solid transparent; background: transparent; border-radius: var(--radius-md); padding: 5px var(--space-2);
  font: inherit; font-size: var(--text-sm); color: var(--hub-text); transition: background-color var(--hub-fast); }
.hub-lane-add input:hover { background: var(--hub-hover); }
.hub-lane-add input::placeholder { color: var(--hub-muted); }
.hub-lane-add input:focus { outline: none; border-color: var(--hub-accent); background: var(--hub-input); }
.hub-lane-add input:disabled { opacity: 0.6; }
.hub-target { display: none; align-items: center; gap: 6px; margin-top: 6px; font-size: var(--text-xs); color: var(--hub-dim); }
.hub-lane-add:focus-within .hub-target, .hub-lane-add.is-busy .hub-target { display: flex; }
.hub-target select { flex: 1; min-width: 0; border: 1px solid var(--hub-border); background: var(--hub-input); color: var(--hub-text);
  border-radius: var(--radius-md); padding: 3px 6px; font: inherit; font-size: var(--text-sm); }
.hub-target select:focus { outline: none; border-color: var(--hub-accent); }
.hub-target option, .hub-target optgroup { background: var(--hub-pop); color: var(--hub-text); }
.hub-lane-body { flex: 1; min-height: 0; overflow-y: auto; padding: 0 var(--space-2) var(--space-2); display: flex; flex-direction: column; gap: 6px; }
.hub-lane-empty { color: var(--hub-muted); font-size: var(--text-sm); text-align: center; padding: var(--space-3) 6px; }
.hub-card { flex: 0 0 auto; position: relative; background: var(--hub-raised); border: 1px solid var(--hub-border); border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-3); cursor: pointer; transition: border-color var(--hub-fast); overflow: hidden; }
.hub-card:hover { border-color: var(--hub-border-strong); }
.hub-card.is-dragging { opacity: 0.45; }
.hub-card.is-hidden { opacity: 0.5; border-style: dashed; }
.hub-card-title { font-weight: var(--weight-medium); font-size: var(--text-md); line-height: var(--leading-tight); word-break: break-word; padding-right: 18px; color: var(--hub-text); }
.hub-card-status { margin-top: 6px; display: flex; }
.hub-card-meta { display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap; color: var(--hub-dim); font-size: var(--text-xs); min-width: 0; }
/* The source is named in text; its color (--hub-source) lives on the filter chip swatch, not as a stripe on every card. */
.hub-card-where { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1 1 auto; }
.hub-card-meta .hub-due { white-space: nowrap; }
.hub-card-meta .hub-due.is-overdue { color: var(--hub-bad); font-weight: var(--weight-medium); }
.hub-pending { color: var(--hub-warn); font-size: var(--text-xs); white-space: nowrap; }
.hub-card-hide { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: var(--radius-md); background: transparent; color: var(--hub-muted); cursor: pointer; opacity: 0; padding: 0;
  transition: opacity var(--hub-fast), color var(--hub-fast), background-color var(--hub-fast); }
.hub-card:hover .hub-card-hide, .hub-card.is-hidden .hub-card-hide, .hub-card-hide:focus-visible { opacity: 1; }
.hub-card-hide:hover { color: var(--hub-text); background: var(--hub-hover); }
.hub-card-hide svg { width: 14px; height: 14px; }

.hub-sync-error { color: var(--hub-bad); font-size: var(--text-xs); white-space: nowrap; font-weight: var(--weight-medium); }
.hub-detail-meta .hub-sync-error { white-space: normal; }
.hub-lane.is-pseudo { border: 1px dashed var(--hub-border-strong); background: transparent; }
.hub-lane.is-pseudo .hub-lane-head .hub-status { flex: 0 1 auto; }
.hub-pseudo-note { padding: 0 var(--space-3) var(--space-2); color: var(--hub-dim); font-size: var(--text-xs); }
.hub-pseudo-actions { display: flex; gap: 6px; padding: 0 var(--space-2) var(--space-3); }
.hub-pseudo-actions .hub-btn { flex: 0 0 auto; }
.hub-merge { flex: 1; min-width: 0; height: 28px; border: 1px solid var(--hub-border); background: var(--hub-input); color: var(--hub-text);
  border-radius: var(--radius-md); padding: 0 6px; font: inherit; font-size: var(--text-sm); cursor: pointer; }
.hub-merge:focus { outline: none; border-color: var(--hub-accent); }
.hub-merge option { background: var(--hub-pop); color: var(--hub-text); }

/* status picker */
.hub-picker-backdrop { position: absolute; inset: 0; z-index: 6; background: var(--scrim); display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.hub-picker { width: min(420px, 100%); max-height: 100%; overflow: auto; background: var(--hub-pop); border: 1px solid var(--hub-border);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-pop); padding: var(--space-4) var(--space-5); }
.hub-picker .hub-section-label { font-size: var(--text-xs); font-weight: var(--weight-regular); color: var(--hub-dim); margin: 0 0 2px; }
.hub-picker-title { margin: 0 0 6px; font-size: var(--text-lg); font-weight: var(--weight-semibold); color: var(--hub-text); }
.hub-picker-help { margin: 0 0 var(--space-3); line-height: var(--leading); }
.hub-picker-list { display: flex; flex-direction: column; gap: 2px; }
.hub-picker-option { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); width: 100%; text-align: left; cursor: pointer;
  border: 0; background: transparent; border-radius: var(--radius-md); padding: 6px var(--space-2); font: inherit; color: var(--hub-text);
  transition: background-color var(--hub-fast); }
.hub-picker-option:hover, .hub-picker-option:focus-visible { background: var(--hub-selected); }
.hub-picker-actions { display: flex; justify-content: flex-end; margin-top: var(--space-3); }

/* task detail */
.hub-detail { position: absolute; inset: 0; background: var(--hub-pop); display: flex; flex-direction: column; z-index: 5; }
.hub-detail-head { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--hub-border); }
.hub-detail-title { font-weight: var(--weight-semibold); font-size: var(--text-lg); flex: 1; min-width: 0; margin: 0; color: var(--hub-text); }
.hub-detail-source { display: inline-flex; align-items: center; gap: 6px; color: var(--hub-dim); font-size: var(--text-xs); margin-bottom: 2px; }
.hub-detail-titles { flex: 1; min-width: 0; }
.hub-detail-body { flex: 1; min-height: 0; overflow: auto; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-5); }
.hub-detail-meta { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: var(--space-2) var(--space-4); align-items: center; font-size: var(--text-sm); }
.hub-detail-meta dt { color: var(--hub-dim); font-size: var(--text-sm); margin: 0; }
.hub-detail-meta dd { margin: 0; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-width: 0; }
.hub-person { display: inline-flex; align-items: center; gap: 6px; }
.hub-section-label { color: var(--hub-text); font-size: var(--text-md); font-weight: var(--weight-semibold); margin: 0 0 var(--space-2); }
.hub-detail-desc { white-space: pre-wrap; color: var(--hub-text); line-height: var(--leading); overflow-wrap: anywhere; }
.hub-msgs { display: flex; flex-direction: column; gap: 2px; }
.hub-msg { border-radius: var(--radius-md); padding: var(--space-2) 0; border-top: 1px solid var(--hub-border); }
.hub-msg:first-child { border-top: 0; }
.hub-msg.is-local { background: var(--hub-raised); border-top-color: transparent; padding: var(--space-2) var(--space-3); }
.hub-msg.is-local + .hub-msg { border-top-color: transparent; }
.hub-msg-head { display: flex; gap: var(--space-2); align-items: center; color: var(--hub-dim); font-size: var(--text-xs); margin-bottom: 2px; }
.hub-msg-head .hub-author { font-weight: var(--weight-medium); font-size: var(--text-sm); color: var(--hub-text); }
.hub-msg-body { white-space: pre-wrap; overflow-wrap: anywhere; }
.hub-unsynced { color: var(--hub-warn); font-size: var(--text-xs); }
.hub-compose { display: flex; gap: var(--space-2); padding: var(--space-3) var(--space-4); border-top: 1px solid var(--hub-border); align-items: flex-end; }
.hub-compose textarea { flex: 1; resize: none; border: 1px solid var(--hub-border); background: var(--hub-input); color: var(--hub-text);
  border-radius: var(--radius-md); padding: 6px var(--space-2); font: inherit; font-size: var(--text-md); min-height: 44px; }
.hub-compose textarea::placeholder { color: var(--hub-muted); }
.hub-compose textarea:focus { outline: none; border-color: var(--hub-accent); box-shadow: var(--focus-ring); }
.hub-compose .hub-send { height: 32px; }

/* agenda */
.hub-day { padding: var(--space-2) var(--space-4) 2px; }
.hub-day-label { font-weight: var(--weight-semibold); font-size: var(--text-sm); color: var(--hub-text); padding: var(--space-1) 0; }
.hub-event { display: flex; gap: var(--space-3); align-items: flex-start; padding: 6px 0; border-bottom: 1px solid var(--hub-border); }
.hub-event.has-url { cursor: pointer; }
.hub-event.has-url:hover .hub-event-title { text-decoration: underline; text-decoration-color: var(--hub-border-strong); text-underline-offset: 2px; }
.hub-event.is-past { opacity: 0.5; }
/* The calendar's color as a dot, not a stripe. */
.hub-event-bar { width: 7px; height: 7px; border-radius: 50%; background: var(--hub-muted); flex: 0 0 auto; margin-top: 6px; }
.hub-event-time { flex: 0 0 96px; color: var(--hub-dim); font-variant-numeric: tabular-nums; font-size: var(--text-sm); padding-top: 1px; }
.hub-event-main { flex: 1; min-width: 0; }
.hub-event-title { font-weight: var(--weight-medium); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hub-event-sub { color: var(--hub-dim); font-size: var(--text-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* The current-time marker: the one live indicator in the agenda. */
.hub-now { display: flex; align-items: center; gap: 6px; color: var(--hub-accent); font-size: var(--text-xs); font-weight: var(--weight-medium); margin: 2px 0; }
.hub-now::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--hub-accent); }
.hub-now::after { content: ''; flex: 1; height: 1px; background: var(--hub-accent); }

/* conversation queue */
.hub-thread { display: flex; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-bottom: 1px solid var(--hub-border); transition: background-color var(--hub-fast); }
.hub-thread:hover { background: var(--hub-hover); }
.hub-thread-main { flex: 1; min-width: 0; }
.hub-thread-top { display: flex; align-items: center; gap: 6px; min-width: 0; }
.hub-thread-title { font-weight: var(--weight-medium); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.hub-thread-time { color: var(--hub-dim); font-size: var(--text-xs); white-space: nowrap; }
.hub-thread-people { color: var(--hub-dim); font-size: var(--text-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hub-thread-text { color: var(--hub-dim); margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hub-thread-actions { display: flex; gap: var(--space-1); margin-top: 6px; flex-wrap: wrap; }
.hub-thread-actions .hub-btn { height: 24px; padding: 0 var(--space-2); font-size: var(--text-xs); }
.hub-task-mark { color: var(--hub-good); font-size: var(--text-xs); font-weight: var(--weight-medium); }

@media (prefers-reduced-motion: reduce) {
  .hub-widget *, .hub-widget *::before, .hub-widget *::after { transition: none !important; }
}
`;

  static ensure(doc = document) {
    if (!doc || doc.getElementById(HubWidgetStyles.STYLE_ID)) return;
    const style = doc.createElement('style');
    style.id = HubWidgetStyles.STYLE_ID;
    style.textContent = HubWidgetStyles.CSS;
    (doc.head || doc.documentElement).appendChild(style);
  }
}
