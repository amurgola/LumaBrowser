import Dom from '../../dom/Dom.js';
import PlacementText from './PlacementText.js';
import LlmSplit from './LlmSplit.js';

export default class SplitEditorPanel {
  constructor(view) {
    this._view = view;
  }

  render(body) {
    const editor = this._view.model.splitEditor;
    if (!editor) return;
    const panel = Dom.el('div', 'adv-spliteditor', SplitEditorPanel._html(editor));
    body.appendChild(panel);
    this._appendTargets(panel.querySelector('#splitTargets'), editor);
    SplitEditorPanel.drawBar(panel, editor);
    this._wire(panel, editor);
  }

  static drawBar(panel, editor) {
    const bar = panel.querySelector('#splitBar');
    if (!bar) return;
    const total = editor.totalBytes || 1;
    const pPct = Math.max(0, Math.min(100, (editor.boundaryBytes / total) * 100));
    bar.innerHTML = '<div class="seg p" style="width:' + pPct + '%">' + (pPct > 12 ? PlacementText.gb(editor.boundaryBytes) : '') + '</div>'
      + '<div class="seg o" style="width:' + (100 - pPct) + '%">' + ((100 - pPct) > 12 ? PlacementText.gb(total - editor.boundaryBytes) : '') + '</div>';
  }

  static overflowGb(editor) {
    return (((editor.totalBytes || 1) - editor.boundaryBytes) / LlmSplit.GIB).toFixed(1);
  }

  static _html(e) {
    const total = e.totalBytes || 1;
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<b>Split LLM: ' + PlacementText.gb(total) + ' total</b>'
      + '<span class="adv-lane-meta">Drag to set how much stays on GPU ' + e.primaryCard + '; send the rest to another card (tensor-split) or RAM (offload).</span></div>'
      + '<div class="adv-splitbar" id="splitBar"></div>'
      + '<input type="range" class="adv-splitrange" id="splitRange" min="0" max="' + Math.round(total / 1e6) + '" value="' + Math.round(e.boundaryBytes / 1e6) + '">'
      + '<div class="adv-splittargets"><span class="adv-lane-meta">Overflow (<span id="splitOverGB">' + SplitEditorPanel.overflowGb(e) + '</span> GB) →</span><span id="splitTargets"></span></div>'
      + '<div style="margin-top:12px;display:flex;gap:8px"><button class="adv-btn primary" id="splitApply">Apply split</button><button class="adv-btn" id="splitCancel">Cancel</button></div>';
  }

  _appendTargets(host, editor) {
    for (const d of (this._view.model.snapshot.devices || [])) {
      if (d.index === editor.primaryCard) continue;
      const selected = editor.target && editor.target.kind === 'gpu' && editor.target.idx === d.index;
      host.appendChild(this._targetButton('GPU ' + d.index, selected, { kind: 'gpu', idx: d.index }));
    }
    host.appendChild(this._targetButton('System RAM', !!(editor.target && editor.target.kind === 'ram'), { kind: 'ram' }));
  }

  _targetButton(label, selected, target) {
    const b = Dom.el('button', 'adv-mini' + (selected ? ' sel' : ''), label);
    b.onclick = () => { this._view.model.splitEditor.target = target; this._view.render(); };
    return b;
  }

  _wire(panel, editor) {
    const range = panel.querySelector('#splitRange');
    range.addEventListener('input', () => {
      editor.boundaryBytes = LlmSplit.clampBoundary(editor.totalBytes || 1, range.value);
      SplitEditorPanel.drawBar(panel, editor);
      const over = panel.querySelector('#splitOverGB');
      if (over) over.textContent = SplitEditorPanel.overflowGb(editor);
    });
    panel.querySelector('#splitApply').onclick = () => this._view.applySplit();
    panel.querySelector('#splitCancel').onclick = () => this._view.closeSplitEditor();
  }
}
