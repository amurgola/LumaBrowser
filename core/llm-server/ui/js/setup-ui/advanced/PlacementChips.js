import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import PlacementItems from './PlacementItems.js';
import PlacementText from './PlacementText.js';
import DropTargets from './DropTargets.js';
import RemoteRefs from './RemoteRefs.js';

export default class PlacementChips {
  constructor(view) {
    this._view = view;
  }

  distribute(root, tray) {
    const model = this._view.model;
    for (const it of PlacementItems.ITEMS) {
      if (!model.itemAvailable(it.key)) continue;
      (this._containerForItem(root, it.key) || tray).appendChild(this.chip(it));
    }
    const ctx = model.context();
    if (ctx && ctx.enabled) (this._containerForContext(root, ctx) || tray).appendChild(this.contextChip());
  }

  chip(it) {
    const srv = (this._view.model.snapshot.servers && this._view.model.snapshot.servers[it.key]) || {};
    const dotCls = srv.offloadToCpu ? 'offload' : (srv.state === 'ready' ? 'ready' : '');
    const bytes = this._view.fit.itemBytes(it.key);
    const chip = Dom.el('span', 'adv-chip ' + it.cls,
      '<span class="dot ' + dotCls + '"></span>'
      + '<span>' + HtmlEscaper.escape(it.label) + '</span>'
      + '<span class="sz">' + HtmlEscaper.escape(srv.modelId || 'unset') + '</span>'
      + (bytes != null ? '<span class="sz">' + PlacementText.gb(bytes) + '</span>' : '<span class="need">needs test</span>'));
    DropTargets.makeDraggable(chip, it.key);
    if (it.key === 'llm' && this._splittable(bytes)) chip.appendChild(this._cutButton());
    return chip;
  }

  contextChip() {
    const ctx = this._view.model.context();
    const chip = Dom.el('span', 'adv-chip ctx',
      '<span>LLM Context</span><span class="sz">' + (ctx.location === 'ram' ? 'in RAM' : 'in VRAM') + '</span>');
    DropTargets.makeDraggable(chip, PlacementItems.CONTEXT_KEY);
    return chip;
  }

  _splittable(bytes) {
    const model = this._view.model;
    if (bytes == null || model.singularityFor('llm')) return false;
    const r = model.resource(model.effectiveResourceId('llm'));
    return !!(r && r.kind !== 'ram' && r.devices && r.devices.length && !RemoteRefs.resourceHasRemote(r));
  }

  _cutButton() {
    const entry = this._view.model.layout.items.llm;
    const split = entry && (entry.split || entry.vramCapBytes);
    const cut = Dom.el('button', 'adv-cut', split ? '✂ edit split' : '✂ split');
    cut.draggable = false;
    cut.addEventListener('mousedown', (ev) => ev.stopPropagation());
    cut.addEventListener('dragstart', (ev) => { ev.preventDefault(); ev.stopPropagation(); });
    cut.addEventListener('click', (ev) => { ev.stopPropagation(); ev.preventDefault(); this._view.openSplitEditor(); });
    return cut;
  }

  _containerForItem(root, key) {
    const model = this._view.model;
    const sing = model.singularityFor(key);
    if (sing) return PlacementChips.container(root, { kind: 'singularity', id: sing.id });
    const entry = model.layout.items[key];
    return entry && entry.resource ? PlacementChips.container(root, { kind: 'resource', id: entry.resource }) : null;
  }

  _containerForContext(root, ctx) {
    if (ctx.location === 'ram') return PlacementChips.container(root, { kind: 'resource', id: 'ram' });
    const model = this._view.model;
    const sing = model.singularityFor('llm');
    if (sing) return PlacementChips.container(root, { kind: 'singularity', id: sing.id });
    const llmRes = model.layout.items.llm && model.layout.items.llm.resource;
    return llmRes ? PlacementChips.container(root, { kind: 'resource', id: llmRes }) : null;
  }

  static container(root, target) {
    if (target.kind === 'auto') return root.querySelector('.adv-tray');
    if (target.kind === 'singularity') {
      const box = root.querySelector('.adv-sing[data-sing="' + target.id + '"]');
      return box ? box.querySelector('.adv-sing-chips') : null;
    }
    const lane = root.querySelector('.adv-lane[data-lane="' + target.id + '"]');
    return lane ? lane.querySelector('.adv-lane-chips') : null;
  }
}
