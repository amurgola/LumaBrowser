export default class AdvancedStyles {
  static ID = 'adv-styles';

  static CSS = `
    #advancedRoot {
      max-width: 1100px;
      --adv-kind-llm: var(--accent); --adv-kind-gen: #60a5fa; --adv-kind-edit: #4ade80;
      --adv-kind-video: #f472b6; --adv-kind-music: #2dd4bf; --adv-kind-grounding: #a3e635;
    }
    .adv-head { display:flex; justify-content:space-between; align-items:flex-start; gap:var(--space-4); margin:var(--space-2) 0 var(--space-4); }
    .adv-head-actions { display:flex; gap:var(--space-2); flex:none; align-items:center; }
    .adv-title { margin:0; font-size:var(--text-lg); font-weight:600; }
    .adv-sub { margin:var(--space-1) 0 0; color:var(--text-secondary); font-size:var(--text-md); max-width:660px; line-height:var(--leading); }
    .adv-gate { border-radius:var(--radius-lg); padding:var(--space-2) var(--space-3); font-size:var(--text-md); margin-bottom:var(--space-4);
      display:flex; gap:10px; align-items:center; background:var(--bg-surface-2); color:var(--text-primary); }
    .adv-gate.warn { background:var(--warning-dim); color:var(--warning); }
    .adv-gate.ok { background:var(--bg-surface-2); color:var(--text-secondary); }
    .adv-tray { display:flex; flex-wrap:wrap; gap:var(--space-2); padding:var(--space-3); border:1px dashed var(--border-strong);
      border-radius:var(--radius-lg); min-height:54px; margin-bottom:var(--space-4); align-items:center;
      transition:border-color var(--dur-fast) var(--ease), background-color var(--dur-fast) var(--ease); }
    .adv-tray-label { width:100%; color:var(--text-secondary); font-size:var(--text-sm); font-weight:500; margin-bottom:2px; }
    .adv-ctxrow { display:flex; align-items:center; gap:10px; margin:0 2px var(--space-3); font-size:var(--text-md); color:var(--text-primary); flex-wrap:wrap; }
    .adv-grid-note { color:var(--text-secondary); font-size:var(--text-sm); margin:2px 2px 10px; line-height:var(--leading); }
    .adv-lanes { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:var(--space-3); }
    .adv-lane { border:1px solid var(--border-soft); border-radius:var(--radius-lg); padding:var(--space-3); background:var(--bg-surface);
      display:flex; flex-direction:column; gap:var(--space-2); min-height:150px;
      transition:border-color var(--dur-fast) var(--ease), background-color var(--dur-fast) var(--ease); }
    .adv-lane.drop { border-color:var(--accent); background:var(--bg-surface-2); }
    .adv-lane.group { border-color:var(--border-strong); }
    .adv-lane.remote { border-style:dashed; border-color:var(--border-strong); }
    .adv-remote-badge { font-size:var(--text-xs); font-weight:500; padding:1px 6px; border-radius:var(--radius-sm); background:var(--bg-surface-2); color:var(--text-secondary); }
    .adv-remote-badge.off { background:var(--danger-dim); color:var(--danger); }
    .adv-lane-head { display:flex; justify-content:space-between; align-items:baseline; gap:var(--space-2); }
    .adv-lane-name { font-weight:600; font-size:var(--text-md); }
    .adv-lane-meta { color:var(--text-secondary); font-size:var(--text-xs); }
    .adv-lane-actions { display:flex; gap:var(--space-1); }
    .adv-mini { min-height:24px; padding:0 var(--space-2); font:inherit; font-size:var(--text-xs); font-weight:500; border-radius:var(--radius-md);
      border:1px solid var(--border-soft); background:var(--bg-surface-2); color:var(--text-primary); cursor:pointer;
      transition:background-color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease); }
    .adv-mini:hover { background:var(--bg-elevated); border-color:var(--border-strong); }
    .adv-order { display:flex; flex-wrap:wrap; gap:var(--space-1); align-items:center; font-size:var(--text-xs); color:var(--text-secondary); }
    .adv-order .ord { display:inline-flex; align-items:center; gap:3px; background:var(--bg-surface-2);
      border-radius:var(--radius-sm); padding:1px 6px; }
    .adv-plan { height:18px; border-radius:var(--radius-sm); background:var(--surface-sunken); overflow:hidden; position:relative; }
    .adv-plan > i { display:block; height:100%; background:color-mix(in srgb, var(--text-secondary) 45%, transparent); transition:width var(--dur) var(--ease); }
    .adv-plan.over > i { background:var(--danger); }
    .adv-plan-cap { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:var(--text-xs); color:var(--text-primary); font-variant-numeric:tabular-nums; }
    .adv-lane-chips { display:flex; flex-wrap:wrap; gap:var(--space-2); flex:1; align-content:flex-start; min-height:34px; }
    .adv-chip { display:inline-flex; align-items:center; gap:var(--space-2); padding:6px 10px; border-radius:var(--radius-md); cursor:grab;
      background:var(--bg-surface-2); border:1px solid var(--border-soft); font-size:var(--text-md); user-select:none;
      transition:border-color var(--dur-fast) var(--ease); }
    .adv-chip:hover { border-color:var(--border-strong); }
    .adv-chip:active { cursor:grabbing; }
    .adv-chip.ctx { font-style:italic; }
    .adv-chip .dot { width:8px; height:8px; border-radius:50%; background:var(--text-muted); flex:none; }
    .adv-chip .dot.ready { background:var(--success); } .adv-chip .dot.offload { background:var(--warning); }
    .adv-chip .sz { color:var(--text-secondary); font-size:var(--text-xs); }
    .adv-chip .need { color:var(--warning); font-size:var(--text-xs); }
    .adv-sing { border:1px solid var(--border-strong); border-radius:var(--radius-lg); padding:var(--space-2); background:var(--surface-sunken);
      display:flex; flex-direction:column; gap:6px; width:100%;
      transition:border-color var(--dur-fast) var(--ease); }
    .adv-sing.drop { border-color:var(--accent); }
    .adv-sing-head { display:flex; justify-content:space-between; align-items:center; font-size:var(--text-xs); color:var(--text-secondary); }
    .adv-sing-chips { display:flex; flex-wrap:wrap; gap:6px; min-height:28px; }
    .adv-badge { font-size:var(--text-xs); font-weight:500; padding:1px 6px; border-radius:var(--radius-sm); background:var(--bg-surface-2); color:var(--text-secondary); }
    .adv-combine { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin:0 2px var(--space-3); padding:var(--space-2) 0;
      color:var(--text-secondary); font-size:var(--text-sm); }
    .adv-combine label { font-size:var(--text-sm); color:var(--text-primary); display:inline-flex; gap:var(--space-1); align-items:center; }
    .adv-spliteditor { border:1px solid var(--border-strong); background:var(--bg-surface); border-radius:var(--radius-lg); padding:var(--space-4); margin:0 2px var(--space-4); }
    .adv-splitbar { position:relative; height:28px; border-radius:var(--radius-md); overflow:hidden; display:flex; background:var(--surface-sunken); margin-top:10px; }
    .adv-splitbar .seg { height:100%; display:flex; align-items:center; justify-content:center; font-size:var(--text-xs); font-weight:600; min-width:0; overflow:hidden; white-space:nowrap; transition:width .05s; }
    .adv-splitbar .seg.p { background:var(--accent); color:var(--on-accent); } .adv-splitbar .seg.o { background:var(--bg-elevated); color:var(--text-primary); }
    .adv-splitrange { width:100%; margin-top:10px; accent-color:var(--accent); }
    .adv-splittargets { display:flex; gap:6px; flex-wrap:wrap; margin-top:var(--space-3); align-items:center; }
    .adv-splittargets .adv-mini.sel { background:var(--bg-elevated); color:var(--text-primary); border-color:var(--accent); }
    .adv-chip .adv-cut { margin-left:var(--space-1); padding:0 6px; font:inherit; font-size:var(--text-xs); border-radius:var(--radius-sm); border:1px solid var(--border-soft);
      background:var(--bg-elevated); color:var(--text-primary); cursor:pointer; }
    .adv-chip .adv-cut:hover { border-color:var(--border-strong); }
    .adv-controls { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin:var(--space-5) 0; }
    .adv-btn { display:inline-flex; align-items:center; min-height:32px; padding:0 var(--space-3); border-radius:var(--radius-md);
      border:1px solid var(--border-soft); background:var(--bg-surface-2); color:var(--text-primary); cursor:pointer;
      font:inherit; font-size:var(--text-md); font-weight:500;
      transition:background-color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease); }
    .adv-btn:hover { background:var(--bg-elevated); border-color:var(--border-strong); }
    .adv-btn:focus-visible, .adv-mini:focus-visible { outline:none; box-shadow:var(--focus-ring); }
    .adv-btn.primary { background:var(--accent); border-color:var(--accent); color:var(--on-accent); }
    .adv-btn.primary:hover { background:var(--accent-hover); border-color:var(--accent-hover); }
    .adv-btn:disabled { opacity:.45; cursor:not-allowed; }
    .adv-field { display:flex; align-items:center; gap:6px; font-size:var(--text-md); color:var(--text-primary); }
    .adv-field input[type=number] { width:64px; min-height:28px; background:var(--surface-input); border:1px solid var(--border-strong);
      color:var(--text-primary); border-radius:var(--radius-md); padding:4px 6px; font:inherit; }
    .adv-field input[type=number]:focus { outline:none; border-color:var(--accent); box-shadow:var(--focus-ring); }
    .adv-test { border:1px solid var(--border-soft); border-radius:var(--radius-xl); padding:var(--space-4); margin-top:var(--space-2); background:var(--bg-surface); }
    .adv-test-row { display:flex; gap:var(--space-4); flex-wrap:wrap; margin-top:var(--space-3); }
    .adv-test-card { flex:1; min-width:220px; }
    .adv-test-card img { width:100%; border-radius:var(--radius-lg); border:1px solid var(--border-soft); }
    .adv-test-card .t { font-size:var(--text-sm); color:var(--text-secondary); margin-top:6px; }
    .adv-test-card .t b { color:var(--text-primary); font-weight:500; }
    .adv-status { color:var(--text-secondary); font-size:var(--text-sm); min-height:16px; }
    .adv-vram-tbl { width:100%; border-collapse:collapse; font-size:var(--text-sm); }
    .adv-vram-tbl td { padding:4px 6px; border-top:1px solid var(--border-soft); color:var(--text-primary); }
    .adv-vram-tbl td.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .adv-leg-item { display:inline-flex; align-items:center; gap:5px; font-size:var(--text-xs); color:var(--text-primary); }
    .adv-leg-item i { width:8px; height:8px; border-radius:2px; display:inline-block; background:var(--text-muted); }
    .adv-leg-item.llm i { background:var(--adv-kind-llm); } .adv-leg-item.gen i { background:var(--adv-kind-gen); } .adv-leg-item.edit i { background:var(--adv-kind-edit); }
    .adv-leg-item.video i { background:var(--adv-kind-video); } .adv-leg-item.music i { background:var(--adv-kind-music); } .adv-leg-item.grounding i { background:var(--adv-kind-grounding); }
    .adv-timing { display:flex; flex-wrap:wrap; gap:6px 12px; margin-top:var(--space-1); font-size:var(--text-xs); color:var(--text-secondary); }
    .adv-timing b { color:var(--text-primary); font-weight:500; }
    .adv-prompt-segs { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .adv-pseg { font-size:var(--text-xs); padding:1px 6px; border-radius:var(--radius-sm); background:var(--bg-surface-2); color:var(--text-primary); }
    .adv-pseg.off { background:transparent; color:var(--text-muted); box-shadow:inset 0 0 0 1px var(--border-soft); }
    .adv-prompt-out { margin-top:var(--space-3); padding:var(--space-3); background:var(--surface-sunken); border:1px solid var(--border-soft);
      border-radius:var(--radius-lg); max-height:460px; overflow:auto; font-size:var(--text-xs); line-height:1.5; color:var(--text-primary);
      white-space:pre-wrap; word-break:break-word; font-family:var(--font-mono); }
    `;

  static inject(doc = document) {
    if (doc.getElementById(AdvancedStyles.ID)) return false;
    const style = doc.createElement('style');
    style.id = AdvancedStyles.ID;
    style.textContent = AdvancedStyles.CSS;
    doc.head.appendChild(style);
    return true;
  }
}
