export default class HubWidgetStyles {
  static STYLE_ID = 'hub-widget-styles';

  static CSS = `
.hub-widget {
  --hub-text: var(--text, #e6e9f2); --hub-dim: var(--text-dim, #8a95ad); --hub-muted: var(--text-muted, #76819b);
  --hub-border: var(--border, rgba(255, 255, 255, 0.07)); --hub-border-strong: var(--border-strong, rgba(255, 255, 255, 0.14));
  --hub-sunken: var(--surface-sunken, rgba(0, 0, 0, 0.22)); --hub-hover: var(--surface-hover, rgba(255, 255, 255, 0.04));
  --hub-input: var(--surface-input, rgba(0, 0, 0, 0.25)); --hub-pop: var(--surface-pop, #141b2c);
  --hub-raised: rgba(255, 255, 255, 0.045); --hub-accent: var(--accent, #f59034); --hub-accent-soft: var(--accent-soft, rgba(245, 144, 52, 0.16));
  --hub-accent-grad: var(--accent-grad, linear-gradient(180deg, #f59034, #e07d22)); --hub-on-accent: var(--on-accent-warm, #1a1206);
  --hub-good: var(--good, #4ade80); --hub-warn: var(--warn, #fbbf24); --hub-bad: var(--bad, #f87171);
  position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 0;
  font-size: 13px; line-height: 1.45; color: var(--hub-text); box-sizing: border-box; }
.cm-live-root.hub-widget { background: transparent; color: var(--hub-text); padding: 0; }
.hub-widget *, .hub-widget *::before, .hub-widget *::after { box-sizing: border-box; }
.hub-widget ::-webkit-scrollbar { width: 8px; height: 8px; }
.hub-widget ::-webkit-scrollbar-thumb { background: rgba(245, 144, 52, 0.15); border-radius: 8px; border: 2px solid transparent; background-clip: content-box; }
.hub-widget ::-webkit-scrollbar-track { background: transparent; }

.hub-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px 10px; border-bottom: 1px solid var(--hub-border); flex: 0 0 auto; flex-wrap: wrap; }
.hub-title { font-weight: 600; font-size: 14px; letter-spacing: -0.01em; margin: 0; flex: 0 0 auto; color: var(--hub-text); }
.hub-sub { color: var(--hub-dim); font-size: 12px; }
.hub-spacer { flex: 1; }
.hub-chips { display: flex; flex-wrap: wrap; gap: 2px; min-width: 0; }
.hub-chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid transparent; background: transparent; color: var(--hub-dim);
  border-radius: 999px; padding: 3px 10px; font: inherit; font-size: 12px; cursor: pointer; line-height: 1.4; transition: color 0.12s, background 0.12s; }
.hub-chip:hover { color: var(--hub-text); background: var(--hub-hover); }
.hub-chip.is-on { background: var(--hub-accent-grad); color: var(--hub-on-accent); font-weight: 600; }
.hub-chip-n { font-variant-numeric: tabular-nums; font-size: 11px; opacity: 0.75; }
.hub-chip.is-on .hub-chip-n { opacity: 0.85; }
.hub-sources:not(:empty) { padding: 3px; border-radius: 999px; background: var(--hub-raised); border: 1px solid var(--hub-border-strong); }
.hub-swatch { display: inline-block; width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; }
.hub-toggle { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--hub-border-strong); background: transparent;
  color: var(--hub-dim); border-radius: 999px; padding: 3px 10px; font: inherit; font-size: 12px; cursor: pointer; }
.hub-toggle:hover { color: var(--hub-text); border-color: var(--hub-dim); }
.hub-toggle.is-on { color: var(--hub-accent); border-color: var(--hub-accent); background: var(--hub-accent-soft); }
.hub-toggle svg { width: 14px; height: 14px; }
.hub-seg { display: inline-flex; gap: 2px; padding: 3px; border: 1px solid var(--hub-border-strong); border-radius: 999px; background: var(--hub-raised); }
.hub-seg button { border: 0; background: transparent; color: var(--hub-dim); font: inherit; font-size: 12px; padding: 2px 10px; cursor: pointer; border-radius: 999px; }
.hub-seg button:hover { color: var(--hub-text); }
.hub-seg button.is-on { background: var(--hub-accent-grad); color: var(--hub-on-accent); font-weight: 600; }
.hub-body { flex: 1; min-height: 0; overflow: auto; }
.hub-error { color: var(--hub-bad); font-size: 12px; padding: 6px 14px; }
.hub-error:empty { display: none; }
.hub-attention { display: flex; flex-direction: column; gap: 4px; padding: 6px 14px; border-bottom: 1px solid var(--hub-border); flex: 0 0 auto;
  background: rgba(248, 113, 113, 0.08); }
.hub-attention:empty { display: none; }
.hub-attention-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--hub-text); }
.hub-attention-row .hub-dot { background: var(--hub-bad); }
.hub-attention-row.is-warn { color: var(--hub-dim); }
.hub-attention-row.is-warn .hub-dot { background: var(--hub-warn); }
.hub-attention-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hub-empty { color: var(--hub-dim); padding: 22px 14px; text-align: center; font-size: 12.5px; }
.hub-badge { display: inline-block; border-radius: 5px; padding: 0 6px; font-size: 11px; font-weight: 600; line-height: 18px;
  background: var(--hub-raised); color: var(--hub-dim); white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
.hub-badge.hub-app { color: #fff; }
.hub-count { display: inline-block; min-width: 20px; text-align: center; border-radius: 999px; padding: 0 6px; font-size: 11px; font-weight: 600;
  line-height: 18px; background: var(--hub-raised); color: var(--hub-dim); font-variant-numeric: tabular-nums; }
.hub-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--hub-muted); flex: 0 0 auto; }
.hub-dot.p-urgent { background: var(--hub-bad); } .hub-dot.p-high { background: var(--hub-warn); } .hub-dot.p-low { background: var(--hub-muted); }
.hub-dot.p-normal { background: #60a5fa; }
.hub-prio { font-size: 11px; font-weight: 600; border-radius: 5px; padding: 0 6px; line-height: 18px; text-transform: capitalize; background: var(--hub-raised); color: var(--hub-dim); }
.hub-prio.p-urgent { background: rgba(248, 113, 113, 0.15); color: var(--hub-bad); } .hub-prio.p-high { background: rgba(251, 191, 36, 0.14); color: var(--hub-warn); }
.hub-prio.p-normal { background: rgba(96, 165, 250, 0.14); color: #93c5fd; }
.hub-btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--hub-border-strong); background: transparent; color: var(--hub-text);
  border-radius: 8px; padding: 4px 10px; font: inherit; font-size: 12px; cursor: pointer; line-height: 1.4; white-space: nowrap; }
.hub-btn:hover { background: var(--hub-hover); border-color: var(--hub-dim); }
.hub-btn.hub-primary { background: var(--hub-accent-grad); border-color: transparent; color: var(--hub-on-accent); font-weight: 600; }
.hub-btn.hub-primary:hover { filter: brightness(1.08); }
.hub-btn:disabled { opacity: 0.5; cursor: default; }
.hub-btn svg { width: 14px; height: 14px; }
.hub-link { color: var(--hub-accent); cursor: pointer; text-decoration: none; }
.hub-link:hover { text-decoration: underline; }
.hub-status { display: inline-flex; align-items: center; gap: 5px; max-width: 100%; border-radius: 5px; padding: 0 7px 0 6px; line-height: 18px;
  font-size: 10.5px; font-weight: 650; letter-spacing: 0.04em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--hub-text); background: color-mix(in srgb, var(--hub-status, #8a95ad) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--hub-status, #8a95ad) 38%, transparent); }
.hub-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--hub-status, #8a95ad); flex: 0 0 auto; }
.hub-avatars { display: inline-flex; }
.hub-avatar { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%;
  font-size: 9.5px; font-weight: 700; color: var(--hub-text); background: #2a3348; border: 1.5px solid var(--hub-pop); letter-spacing: 0.02em; }
.hub-avatar + .hub-avatar { margin-left: -4px; }

/* board */
.hub-lanes { display: flex; gap: 12px; padding: 12px 14px 14px; height: 100%; min-height: 0; overflow-x: auto; overflow-y: hidden; }
.hub-lane { flex: 1 1 240px; min-width: 240px; display: flex; flex-direction: column; min-height: 0; background: var(--hub-sunken);
  border-radius: 12px; border: 1px solid var(--hub-border); transition: border-color 0.12s, background 0.12s; }
.hub-lane.is-over { border-color: var(--hub-accent); background: var(--hub-accent-soft); }
.hub-lane-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px 8px; font-weight: 600; font-size: 11px;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--hub-dim); }
.hub-lane-head .hub-count { letter-spacing: 0; }
.hub-lane.is-done .hub-lane-head::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--hub-good); }
.hub-lane-head .hub-spacer { flex: 1; }
.hub-lane-action { border: 0; background: transparent; color: var(--hub-muted); font: inherit; font-size: 11px; letter-spacing: 0; text-transform: none;
  cursor: pointer; padding: 1px 6px; border-radius: 6px; }
.hub-lane-action:hover { color: var(--hub-text); background: var(--hub-hover); }
.hub-lane-add { padding: 0 8px 8px; }
.hub-lane-add input { width: 100%; border: 1px dashed var(--hub-border-strong); background: transparent; border-radius: 8px; padding: 6px 10px;
  font: inherit; font-size: 12.5px; color: var(--hub-text); }
.hub-lane-add input::placeholder { color: var(--hub-muted); }
.hub-lane-add input:focus { outline: none; border-style: solid; border-color: var(--hub-accent); background: var(--hub-input); }
.hub-lane-add input:disabled { opacity: 0.6; }
.hub-target { display: none; align-items: center; gap: 6px; margin-top: 6px; font-size: 11.5px; color: var(--hub-dim); }
.hub-lane-add:focus-within .hub-target, .hub-lane-add.is-busy .hub-target { display: flex; }
.hub-target select { flex: 1; min-width: 0; border: 1px solid var(--hub-border-strong); background: var(--hub-input); color: var(--hub-text);
  border-radius: 7px; padding: 3px 6px; font: inherit; font-size: 12px; }
.hub-target select:focus { outline: none; border-color: var(--hub-accent); }
.hub-target option, .hub-target optgroup { background: var(--hub-pop); color: var(--hub-text); }
.hub-lane-body { flex: 1; min-height: 0; overflow-y: auto; padding: 0 8px 8px; display: flex; flex-direction: column; gap: 8px; }
.hub-lane-empty { color: var(--hub-muted); font-size: 12px; text-align: center; padding: 14px 6px; border: 1px dashed var(--hub-border); border-radius: 8px; }
.hub-card { flex: 0 0 auto; position: relative; background: var(--hub-pop); border: 1px solid var(--hub-border-strong); border-radius: 10px; padding: 9px 10px 9px 13px;
  cursor: pointer; box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.3)); transition: border-color 0.12s, transform 0.12s; overflow: hidden; }
.hub-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--hub-source, var(--hub-muted)); }
.hub-card:hover { border-color: color-mix(in srgb, var(--hub-accent) 45%, transparent); transform: translateY(-1px); }
.hub-card.is-dragging { opacity: 0.45; }
.hub-card.is-hidden { opacity: 0.5; border-style: dashed; }
.hub-card-title { font-weight: 550; font-size: 13px; line-height: 1.35; word-break: break-word; padding-right: 18px; color: var(--hub-text); }
.hub-card-status { margin-top: 7px; display: flex; }
.hub-card-meta { display: flex; align-items: center; gap: 6px; margin-top: 7px; flex-wrap: wrap; color: var(--hub-dim); font-size: 11.5px; min-width: 0; }
.hub-card-where { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1 1 auto; }
.hub-card-meta .hub-due { white-space: nowrap; }
.hub-card-meta .hub-due.is-overdue { color: var(--hub-bad); font-weight: 600; }
.hub-pending { color: var(--hub-warn); font-size: 11px; white-space: nowrap; }
.hub-card-hide { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: 6px; background: transparent; color: var(--hub-muted); cursor: pointer; opacity: 0; transition: opacity 0.12s; padding: 0; }
.hub-card:hover .hub-card-hide, .hub-card.is-hidden .hub-card-hide, .hub-card-hide:focus-visible { opacity: 1; }
.hub-card-hide:hover { color: var(--hub-text); background: var(--hub-hover); }
.hub-card-hide svg { width: 14px; height: 14px; }

.hub-sync-error { color: var(--hub-bad); font-size: 11px; white-space: nowrap; font-weight: 600; }
.hub-detail-meta .hub-sync-error { white-space: normal; font-weight: 500; }
.hub-lane.is-pseudo { border: 1px dashed color-mix(in srgb, var(--hub-accent) 55%, transparent); background: color-mix(in srgb, var(--hub-accent) 5%, var(--hub-sunken)); }
.hub-lane.is-pseudo .hub-lane-head { text-transform: none; letter-spacing: 0; }
.hub-lane.is-pseudo .hub-lane-head .hub-status { flex: 0 1 auto; }
.hub-pseudo-note { padding: 0 12px 8px; color: var(--hub-dim); font-size: 11.5px; }
.hub-pseudo-actions { display: flex; gap: 6px; padding: 0 8px 10px; }
.hub-pseudo-actions .hub-btn { flex: 0 0 auto; }
.hub-merge { flex: 1; min-width: 0; border: 1px solid var(--hub-border-strong); background: var(--hub-input); color: var(--hub-text);
  border-radius: 8px; padding: 3px 6px; font: inherit; font-size: 12px; cursor: pointer; }
.hub-merge:focus { outline: none; border-color: var(--hub-accent); }
.hub-merge option { background: var(--hub-pop); color: var(--hub-text); }

/* status picker */
.hub-picker-backdrop { position: absolute; inset: 0; z-index: 6; background: rgba(5, 8, 15, 0.6); display: flex; align-items: center; justify-content: center; padding: 16px; }
.hub-picker { width: min(420px, 100%); max-height: 100%; overflow: auto; background: var(--hub-pop); border: 1px solid var(--hub-border-strong);
  border-radius: var(--radius-xl, 14px); box-shadow: var(--shadow-md, 0 6px 24px rgba(0, 0, 0, 0.35)); padding: 16px 18px; }
.hub-picker-title { margin: 0 0 6px; font-size: 15px; font-weight: 600; color: var(--hub-text); }
.hub-picker-help { margin: 0 0 12px; line-height: 1.5; }
.hub-picker-list { display: flex; flex-direction: column; gap: 6px; }
.hub-picker-option { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; text-align: left; cursor: pointer;
  border: 1px solid var(--hub-border); background: var(--hub-raised); border-radius: 8px; padding: 7px 10px; font: inherit; color: var(--hub-text); }
.hub-picker-option:hover, .hub-picker-option:focus-visible { border-color: var(--hub-accent); outline: none; background: var(--hub-accent-soft); }
.hub-picker-actions { display: flex; justify-content: flex-end; margin-top: 12px; }

/* task detail */
.hub-detail { position: absolute; inset: 0; background: var(--hub-pop); display: flex; flex-direction: column; z-index: 5; }
.hub-detail-head { display: flex; align-items: center; gap: 8px; padding: 14px 16px 12px; border-bottom: 1px solid var(--hub-border); }
.hub-detail-title { font-weight: 600; font-size: 16px; letter-spacing: -0.01em; flex: 1; min-width: 0; margin: 0; color: var(--hub-text); }
.hub-detail-source { display: inline-flex; align-items: center; gap: 6px; color: var(--hub-dim); font-size: 11px; letter-spacing: 0.08em;
  text-transform: uppercase; font-weight: 600; margin-bottom: 3px; }
.hub-detail-titles { flex: 1; min-width: 0; }
.hub-detail-body { flex: 1; min-height: 0; overflow: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; }
.hub-detail-meta { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 7px 16px; align-items: center; font-size: 12.5px; }
.hub-detail-meta dt { color: var(--hub-muted); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; margin: 0; }
.hub-detail-meta dd { margin: 0; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-width: 0; }
.hub-person { display: inline-flex; align-items: center; gap: 6px; }
.hub-section-label { color: var(--hub-muted); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; margin: 0 0 6px; }
.hub-detail-desc { white-space: pre-wrap; color: var(--hub-text); background: var(--hub-sunken); border: 1px solid var(--hub-border);
  border-radius: 10px; padding: 12px 14px; line-height: 1.55; overflow-wrap: anywhere; }
.hub-msgs { display: flex; flex-direction: column; gap: 8px; }
.hub-msg { border: 1px solid var(--hub-border); border-radius: 10px; padding: 8px 12px; background: var(--hub-raised); }
.hub-msg.is-local { background: var(--hub-accent-soft); border-color: color-mix(in srgb, var(--hub-accent) 30%, transparent); }
.hub-msg-head { display: flex; gap: 8px; align-items: center; color: var(--hub-dim); font-size: 11.5px; margin-bottom: 3px; }
.hub-msg-head .hub-author { font-weight: 600; color: var(--hub-text); }
.hub-msg-body { white-space: pre-wrap; overflow-wrap: anywhere; }
.hub-unsynced { color: var(--hub-warn); font-size: 11px; }
.hub-compose { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--hub-border); align-items: flex-end; }
.hub-compose textarea { flex: 1; resize: none; border: 1px solid var(--hub-border-strong); background: var(--hub-input); color: var(--hub-text);
  border-radius: 10px; padding: 8px 10px; font: inherit; font-size: 13px; min-height: 44px; }
.hub-compose textarea::placeholder { color: var(--hub-muted); }
.hub-compose textarea:focus { outline: none; border-color: var(--hub-accent); }
.hub-compose .hub-send { padding: 8px 16px; }

/* agenda */
.hub-day { padding: 8px 14px 2px; }
.hub-day-label { font-weight: 600; font-size: 11px; color: var(--hub-accent); text-transform: uppercase; letter-spacing: 0.12em; padding: 4px 0; }
.hub-event { display: flex; gap: 10px; align-items: flex-start; padding: 7px 0; border-bottom: 1px solid var(--hub-border); }
.hub-event.has-url { cursor: pointer; }
.hub-event.has-url:hover .hub-event-title { color: var(--hub-accent); }
.hub-event.is-past { opacity: 0.5; }
.hub-event-bar { width: 3px; align-self: stretch; border-radius: 2px; background: var(--hub-muted); flex: 0 0 auto; }
.hub-event-time { flex: 0 0 96px; color: var(--hub-dim); font-variant-numeric: tabular-nums; font-size: 12px; padding-top: 1px; }
.hub-event-main { flex: 1; min-width: 0; }
.hub-event-title { font-weight: 550; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hub-event-sub { color: var(--hub-dim); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hub-now { display: flex; align-items: center; gap: 6px; color: var(--hub-accent); font-size: 11px; font-weight: 600; margin: 2px 0; }
.hub-now::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--hub-accent); }
.hub-now::after { content: ''; flex: 1; height: 1px; background: var(--hub-accent); }

/* conversation queue */
.hub-thread { display: flex; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--hub-border); }
.hub-thread:hover { background: var(--hub-hover); }
.hub-thread-main { flex: 1; min-width: 0; }
.hub-thread-top { display: flex; align-items: center; gap: 6px; min-width: 0; }
.hub-thread-title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.hub-thread-time { color: var(--hub-dim); font-size: 11.5px; white-space: nowrap; }
.hub-thread-people { color: var(--hub-dim); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hub-thread-text { color: var(--hub-text); opacity: 0.85; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hub-thread-actions { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.hub-thread-actions .hub-btn { padding: 2px 8px; font-size: 11.5px; }
.hub-task-mark { color: var(--hub-good); font-size: 11px; font-weight: 600; }
`;

  static ensure(doc = document) {
    if (!doc || doc.getElementById(HubWidgetStyles.STYLE_ID)) return;
    const style = doc.createElement('style');
    style.id = HubWidgetStyles.STYLE_ID;
    style.textContent = HubWidgetStyles.CSS;
    (doc.head || doc.documentElement).appendChild(style);
  }
}
