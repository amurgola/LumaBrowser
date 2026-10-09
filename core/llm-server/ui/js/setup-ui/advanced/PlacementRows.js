import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import PlacementText from './PlacementText.js';

export default class PlacementRows {
  constructor(view) {
    this._view = view;
  }

  gate() {
    if (this._view.model.canApply) {
      return Dom.el('div', 'adv-gate ok', 'Measured footprints on file. This layout can be allocated.');
    }
    return Dom.el('div', 'adv-gate warn',
      '⚠ Run a test render before allocating. Placed models need a measured VRAM/RAM footprint first (see “Test render” below).');
  }

  contextRow() {
    const ctx = this._view.model.context() || { enabled: false, location: 'vram' };
    const row = Dom.el('div', 'adv-ctxrow',
      '<label class="adv-field"><input type="checkbox" id="advCtxSplit"' + (ctx.enabled ? ' checked' : '')
      + '> Split LLM context into its own item</label>'
      + '<span class="adv-lane-meta">Makes the LLM size context-agnostic (useful in singularities). Drop the context chip on System RAM to keep the KV cache off the GPU (--no-kv-offload), or on the LLM’s card to keep it in VRAM.</span>');
    row.querySelector('#advCtxSplit').addEventListener('change', (e) => this._view.setContextSplit(!!e.target.checked));
    return row;
  }

  combineRow() {
    const model = this._view.model;
    const grouped = model.groupedDevices();
    const free = (model.snapshot.devices || []).filter((d) => !grouped.has(d.index));
    const freeRemote = (model.snapshot.remoteDevices || []).filter((d) => !grouped.has(d.ref));
    return model.combineOpen ? this._combinePicker(free, freeRemote) : this._combineButton(free.length + freeRemote.length);
  }

  _combineButton(freeCount) {
    const row = Dom.el('div', 'adv-combine');
    const btn = Dom.el('button', 'adv-mini', '＋ Combine GPUs into an ordered group');
    btn.disabled = freeCount < 2;
    btn.title = freeCount < 2 ? 'Need 2 or more ungrouped GPUs' : 'Create an overflow group';
    btn.onclick = () => { this._view.model.combineOpen = true; this._view.render(); };
    row.appendChild(btn);
    row.appendChild(Dom.el('span', 'adv-lane-meta', 'A group fills its first card, then overflows to the next (LLM tensor-split / image next-free-card). Remote GPUs may join for the LLM; they fill after the local cards.'));
    return row;
  }

  _combinePicker(free, freeRemote) {
    const esc = HtmlEscaper.escape;
    const row = Dom.el('div', 'adv-combine', '<span class="adv-lane-meta">Pick 2+ GPUs (order = fill order; local cards fill before remote):</span>');
    for (const d of free) {
      row.appendChild(Dom.el('label', null, '<input type="checkbox" data-dev="' + d.index + '"> GPU ' + d.index + ' · ' + esc(PlacementText.shortName(d.name))));
    }
    for (const d of freeRemote) {
      row.appendChild(Dom.el('label', null, '<input type="checkbox" data-ref="' + esc(d.ref) + '"> '
        + esc(d.peerName || 'Peer') + ' GPU ' + d.index + ' · ' + esc(PlacementText.shortName(d.name || ''))
        + ' <span class="adv-remote-badge' + (d.online === false ? ' off' : '') + '">'
        + (d.online === false ? 'offline' : 'remote') + '</span>'));
    }
    row.appendChild(this._createButton(row));
    row.appendChild(this._cancelButton());
    return row;
  }

  _createButton(row) {
    const create = Dom.el('button', 'adv-mini', 'Create group');
    create.onclick = () => {
      const picked = Array.from(row.querySelectorAll('input[data-dev]:checked')).map((c) => Number(c.dataset.dev));
      const pickedRemote = Array.from(row.querySelectorAll('input[data-ref]:checked')).map((c) => c.dataset.ref);
      this._view.model.combineOpen = false;
      this._view.createGroup([...picked, ...pickedRemote]);
    };
    return create;
  }

  _cancelButton() {
    const cancel = Dom.el('button', 'adv-mini', 'Cancel');
    cancel.onclick = () => { this._view.model.combineOpen = false; this._view.render(); };
    return cancel;
  }
}
