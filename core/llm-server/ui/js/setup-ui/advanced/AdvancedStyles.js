export default class AdvancedStyles {
  static ID = 'adv-styles';

  static CSS = `
    #advancedRoot { max-width: 1100px; }
    .adv-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin:8px 0 14px; }
    .adv-head-actions { display:flex; gap:8px; flex:none; }
    .adv-title { margin:0; font-size:20px; }
    .adv-sub { margin:4px 0 0; color:#8a95ad; font-size:13px; max-width:660px; }
    .adv-gate { border-radius:10px; padding:10px 14px; font-size:13px; margin-bottom:14px; display:flex; gap:10px; align-items:center; }
    .adv-gate.warn { background:rgba(245,144,52,0.10); border:1px solid rgba(245,144,52,0.35); color:#f6c08a; }
    .adv-gate.ok { background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.30); color:#9ae6b4; }
    .adv-tray { display:flex; flex-wrap:wrap; gap:10px; padding:12px; border:1px dashed rgba(255,255,255,0.16);
      border-radius:10px; min-height:54px; margin-bottom:14px; background:rgba(255,255,255,0.02); align-items:center; }
    .adv-tray-label { width:100%; color:#8a95ad; font-size:11px; text-transform:uppercase; letter-spacing:.05em; margin-bottom:2px; }
    .adv-ctxrow { display:flex; align-items:center; gap:10px; margin:0 2px 12px; font-size:13px; color:#c4cad8; flex-wrap:wrap; }
    .adv-grid-note { color:#6b7488; font-size:11px; margin:2px 2px 10px; }
    .adv-lanes { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
    .adv-lane { border:1px solid rgba(255,255,255,0.10); border-radius:12px; padding:12px; background:#161a23;
      display:flex; flex-direction:column; gap:9px; min-height:150px; transition:border-color .12s,background .12s; }
    .adv-lane.drop { border-color:#f59034; background:rgba(245,144,52,0.07); }
    .adv-lane.group { border-color:rgba(99,102,241,0.40); }
    .adv-lane.remote { border-style:dashed; border-color:rgba(45,212,191,0.35); }
    .adv-remote-badge { font-size:10px; padding:1px 6px; border-radius:999px; background:rgba(45,212,191,0.15); color:#7fe0d0; }
    .adv-remote-badge.off { background:rgba(224,85,107,0.15); color:#f0a3b0; }
    .adv-lane-head { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
    .adv-lane-name { font-weight:600; font-size:14px; }
    .adv-lane-meta { color:#8a95ad; font-size:11px; }
    .adv-lane-actions { display:flex; gap:4px; }
    .adv-mini { padding:2px 7px; font-size:11px; border-radius:6px; border:1px solid rgba(255,255,255,0.16);
      background:#222838; color:#c4cad8; cursor:pointer; }
    .adv-mini:hover { border-color:rgba(255,255,255,0.3); }
    .adv-order { display:flex; flex-wrap:wrap; gap:4px; align-items:center; font-size:11px; color:#8a95ad; }
    .adv-order .ord { display:inline-flex; align-items:center; gap:3px; background:#1b2030; border:1px solid rgba(255,255,255,0.10);
      border-radius:6px; padding:2px 6px; }
    .adv-plan { height:18px; border-radius:5px; background:rgba(255,255,255,0.05); overflow:hidden; position:relative; }
    .adv-plan > i { display:block; height:100%; background:linear-gradient(90deg,#3b82f6,#6366f1); transition:width .2s; }
    .adv-plan.over > i { background:linear-gradient(90deg,#e0556b,#f0728a); }
    .adv-plan-cap { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:10px; color:#cdd3e1; }
    .adv-lane-chips { display:flex; flex-wrap:wrap; gap:8px; flex:1; align-content:flex-start; min-height:34px; }
    .adv-chip { display:inline-flex; align-items:center; gap:8px; padding:7px 10px; border-radius:8px; cursor:grab;
      background:#222838; border:1px solid rgba(255,255,255,0.12); font-size:13px; user-select:none; }
    .adv-chip:active { cursor:grabbing; }
    .adv-chip.llm { border-left:3px solid #f59034; }
    .adv-chip.gen { border-left:3px solid #3b82f6; }
    .adv-chip.edit { border-left:3px solid #22c55e; }
    .adv-chip.video { border-left:3px solid #ec4899; }
    .adv-chip.music { border-left:3px solid #14b8a6; }
    .adv-chip.grounding { border-left:3px solid #84cc16; }
    .adv-chip.ctx { border-left:3px solid #a855f7; font-style:italic; }
    .adv-chip .dot { width:8px; height:8px; border-radius:50%; background:#6b7280; flex:none; }
    .adv-chip .dot.ready { background:#22c55e; } .adv-chip .dot.offload { background:#f59e0b; }
    .adv-chip .sz { color:#8a95ad; font-size:11px; }
    .adv-chip .need { color:#f6a96a; font-size:10px; }
    .adv-sing { border:1px solid rgba(168,85,247,0.40); border-radius:10px; padding:8px; background:rgba(168,85,247,0.05);
      display:flex; flex-direction:column; gap:6px; width:100%; }
    .adv-sing.drop { border-color:#a855f7; background:rgba(168,85,247,0.12); }
    .adv-sing-head { display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#caa7e8; }
    .adv-sing-chips { display:flex; flex-wrap:wrap; gap:6px; min-height:28px; }
    .adv-badge { font-size:10px; padding:1px 6px; border-radius:999px; background:rgba(168,85,247,0.18); color:#d6b4f5; }
    .adv-combine { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin:0 2px 12px; padding:10px;
      border:1px dashed rgba(99,102,241,0.35); border-radius:10px; background:rgba(99,102,241,0.05); }
    .adv-combine label { font-size:12px; color:#c4cad8; display:inline-flex; gap:4px; align-items:center; }
    .adv-spliteditor { border:1px solid rgba(245,144,52,0.45); background:rgba(245,144,52,0.06); border-radius:10px; padding:14px; margin:0 2px 14px; }
    .adv-splitbar { position:relative; height:28px; border-radius:6px; overflow:hidden; display:flex; background:rgba(255,255,255,0.05); margin-top:10px; }
    .adv-splitbar .seg { height:100%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:#0d0d0d; min-width:0; overflow:hidden; white-space:nowrap; transition:width .05s; }
    .adv-splitbar .seg.p { background:#f59034; } .adv-splitbar .seg.o { background:#6366f1; color:#e6e9f2; }
    .adv-splitrange { width:100%; margin-top:10px; accent-color:#f59034; }
    .adv-splittargets { display:flex; gap:6px; flex-wrap:wrap; margin-top:12px; align-items:center; }
    .adv-splittargets .adv-mini.sel { background:#f59034; color:#1a1205; border-color:#f59034; font-weight:600; }
    .adv-chip .adv-cut { margin-left:4px; padding:1px 6px; font-size:10px; border-radius:5px; border:1px solid rgba(255,255,255,0.2);
      background:#2c3447; color:#cdd3e1; cursor:pointer; }
    .adv-chip .adv-cut:hover { border-color:#f59034; color:#f6c08a; }
    .adv-controls { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin:18px 0; }
    .adv-btn { padding:8px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.16); background:#222838;
      color:#e6e9f2; cursor:pointer; font-size:13px; }
    .adv-btn.primary { background:#f59034; border-color:#f59034; color:#1a1205; font-weight:600; }
    .adv-btn:disabled { opacity:.5; cursor:not-allowed; }
    .adv-field { display:flex; align-items:center; gap:6px; font-size:13px; color:#c4cad8; }
    .adv-field input[type=number] { width:64px; background:#0f131b; border:1px solid rgba(255,255,255,0.14);
      color:#e6e9f2; border-radius:6px; padding:5px 6px; }
    .adv-test { border:1px solid rgba(255,255,255,0.10); border-radius:12px; padding:14px; margin-top:8px; background:#12161f; }
    .adv-test-row { display:flex; gap:16px; flex-wrap:wrap; margin-top:12px; }
    .adv-test-card { flex:1; min-width:220px; }
    .adv-test-card img { width:100%; border-radius:8px; border:1px solid rgba(255,255,255,0.1); }
    .adv-test-card .t { font-size:12px; color:#8a95ad; margin-top:6px; }
    .adv-test-card .t b { color:#e6e9f2; }
    .adv-status { color:#8a95ad; font-size:12px; min-height:16px; }
    .adv-vram-tbl { width:100%; border-collapse:collapse; font-size:12px; }
    .adv-vram-tbl td { padding:4px 6px; border-top:1px solid rgba(255,255,255,0.06); color:#c4cad8; }
    .adv-vram-tbl td.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .adv-leg-item { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:#c4cad8; }
    .adv-leg-item i { width:9px; height:9px; border-radius:2px; display:inline-block; }
    .adv-leg-item.llm i { background:#f59034; } .adv-leg-item.gen i { background:#3b82f6; } .adv-leg-item.edit i { background:#22c55e; }
    .adv-leg-item.video i { background:#ec4899; } .adv-leg-item.music i { background:#14b8a6; } .adv-leg-item.grounding i { background:#84cc16; }
    .adv-timing { display:flex; flex-wrap:wrap; gap:6px 12px; margin-top:4px; font-size:11px; color:#8a95ad; }
    .adv-timing b { color:#c4cad8; font-weight:600; }
    .adv-prompt-segs { display:flex; flex-wrap:wrap; gap:6px 10px; margin-top:10px; }
    .adv-pseg { font-size:11px; padding:2px 8px; border-radius:999px; border:1px solid rgba(255,255,255,0.10); }
    .adv-pseg.on { color:#c7f0d8; border-color:rgba(52,211,153,0.35); background:rgba(52,211,153,0.08); }
    .adv-pseg.off { color:#6b7488; }
    .adv-prompt-out { margin-top:12px; padding:12px; background:#0f131b; border:1px solid rgba(255,255,255,0.08);
      border-radius:8px; max-height:460px; overflow:auto; font-size:11.5px; line-height:1.5; color:#c4cad8;
      white-space:pre-wrap; word-break:break-word; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
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
