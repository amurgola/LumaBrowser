import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import PlacementText from './PlacementText.js';
import RemoteRefs from './RemoteRefs.js';
import DropTargets from './DropTargets.js';

export default class PlacementLanes {
  constructor(view) {
    this._view = view;
  }

  build() {
    const model = this._view.model;
    const lanes = Dom.el('div', 'adv-lanes');
    const grouped = model.groupedDevices();
    for (const r of model.layout.resources) if (r.kind === 'gpu-group') lanes.appendChild(this.groupLane(r));
    for (const dev of (model.snapshot.devices || [])) if (!grouped.has(dev.index)) lanes.appendChild(this.gpuLane(dev));
    for (const rd of (model.snapshot.remoteDevices || [])) if (!grouped.has(rd.ref)) lanes.appendChild(this.remoteLane(rd));
    for (const rd of this._unpairedRemotes(grouped)) lanes.appendChild(this.remoteLane(rd));
    lanes.appendChild(this.ramLane());
    return lanes;
  }

  gpuLane(d) {
    const resId = 'g' + d.index;
    const lane = this._lane('adv-lane gpu', resId);
    lane.appendChild(Dom.el('div', 'adv-lane-head', '<span class="adv-lane-name">GPU ' + d.index + '</span>'
      + '<span class="adv-lane-meta">' + HtmlEscaper.escape(PlacementText.shortName(d.name)) + '</span>'));
    lane.appendChild(Dom.el('div', 'adv-lane-meta adv-lane-free', PlacementText.gb(d.freeBytes) + ' free / ' + PlacementText.gb(d.totalBytes)));
    lane.appendChild(this.planBar(resId, this._view.model.resource(resId)));
    lane.appendChild(this._singularityActions(resId));
    lane.appendChild(Dom.el('div', 'adv-lane-chips'));
    this._wireDrop(lane, { kind: 'resource', id: resId });
    this._appendSingularities(lane, resId);
    return lane;
  }

  remoteLane(rd) {
    const lane = this._lane('adv-lane gpu remote', rd.ref);
    lane.appendChild(Dom.el('div', 'adv-lane-head',
      '<span class="adv-lane-name">' + HtmlEscaper.escape(rd.peerName || 'Peer') + ' GPU ' + rd.index + '</span>'
      + '<span class="adv-lane-meta">' + HtmlEscaper.escape(PlacementText.shortName(rd.name || '')) + ' ' + PlacementLanes._remoteBadge(rd) + '</span>'));
    lane.appendChild(Dom.el('div', 'adv-lane-meta adv-lane-free',
      (rd.totalBytes ? PlacementText.gb(rd.freeBytes) + ' free / ' + PlacementText.gb(rd.totalBytes) : 'not reachable')
      + ' · LLM only'
      + (rd.online === false ? ' · skipped at launch' : '')));
    lane.appendChild(this.planBar(rd.ref, this._view.model.resource(rd.ref)));
    lane.appendChild(Dom.el('div', 'adv-lane-chips'));
    this._wireDrop(lane, { kind: 'resource', id: rd.ref });
    return lane;
  }

  groupLane(r) {
    const hasRemote = RemoteRefs.resourceHasRemote(r);
    const lane = this._lane('adv-lane gpu group' + (hasRemote ? ' remote' : ''), r.id);
    lane.appendChild(this._groupHead(r, hasRemote));
    lane.appendChild(this._groupOrder(r));
    lane.appendChild(this.planBar(r.id, r));
    if (!hasRemote) lane.appendChild(this._singularityActions(r.id));
    lane.appendChild(Dom.el('div', 'adv-lane-chips'));
    this._wireDrop(lane, { kind: 'resource', id: r.id });
    this._appendSingularities(lane, r.id);
    return lane;
  }

  ramLane() {
    const lane = this._lane('adv-lane ram', 'ram');
    lane.appendChild(Dom.el('div', 'adv-lane-head', '<span class="adv-lane-name">System RAM</span><span class="adv-lane-meta">CPU offload</span>'));
    const plan = this._view.fit.lanePlanned('ram');
    lane.appendChild(Dom.el('div', 'adv-lane-meta', 'Weights/context stream from RAM: slower, no VRAM'
      + (plan.bytes ? ' · planned ' + PlacementText.gb(plan.bytes) : '')));
    lane.appendChild(Dom.el('div', 'adv-lane-chips'));
    this._wireDrop(lane, { kind: 'resource', id: 'ram' });
    return lane;
  }

  planBar(resId, resource) {
    const cap = this._view.fit.capacity(resource);
    const plan = this._view.fit.lanePlanned(resId);
    const wrap = Dom.el('div', 'adv-plan');
    const fill = Dom.el('i');
    const pct = (cap && plan.bytes != null) ? (plan.bytes / cap) * 100 : 0;
    fill.style.width = Math.min(100, Math.max(0, pct)).toFixed(1) + '%';
    if (pct > 100) wrap.classList.add('over');
    wrap.appendChild(fill);
    const label = (plan.bytes ? PlacementText.gb(plan.bytes) : '0 GB') + (cap ? ' / ' + PlacementText.gb(cap) : '')
      + (plan.anyMissing ? ' · needs test' : '');
    wrap.appendChild(Dom.el('div', 'adv-plan-cap', label));
    return wrap;
  }

  _unpairedRemotes(grouped) {
    const model = this._view.model;
    const known = new Set((model.snapshot.remoteDevices || []).map((d) => d.ref));
    const out = [];
    for (const r of model.layout.resources) {
      if (r.kind !== 'gpu' || r.devices.length !== 1 || !RemoteRefs.isRemote(r.devices[0])) continue;
      const ref = r.devices[0];
      if (known.has(ref) || grouped.has(ref)) continue;
      out.push({ ref, peerName: 'Unpaired peer', index: RemoteRefs.indexOf(ref), name: null, totalBytes: null, freeBytes: null, online: false });
    }
    return out;
  }

  _lane(cls, id) {
    const lane = Dom.el('div', cls);
    lane.dataset.lane = id;
    return lane;
  }

  _groupHead(r, hasRemote) {
    const head = Dom.el('div', 'adv-lane-head', '<span class="adv-lane-name">GPU group</span>'
      + (hasRemote ? '<span class="adv-lane-meta"><span class="adv-remote-badge">includes remote</span> LLM only</span>' : ''));
    const actions = Dom.el('div', 'adv-lane-actions');
    const un = Dom.el('button', 'adv-mini', 'Ungroup');
    un.onclick = () => this._view.ungroup(r.id);
    actions.appendChild(un);
    head.appendChild(actions);
    return head;
  }

  _groupOrder(r) {
    const order = Dom.el('div', 'adv-order');
    r.devices.forEach((idx, i) => {
      const ord = Dom.el('span', 'ord', (i + 1) + '. ' + this._orderLabel(idx) + ' ');
      const up = Dom.el('button', 'adv-mini', '↑');
      up.onclick = () => this._view.reorder(r.id, i, i - 1);
      const dn = Dom.el('button', 'adv-mini', '↓');
      dn.onclick = () => this._view.reorder(r.id, i, i + 1);
      ord.appendChild(up);
      ord.appendChild(dn);
      order.appendChild(ord);
    });
    return order;
  }

  _orderLabel(idx) {
    const esc = HtmlEscaper.escape;
    if (RemoteRefs.isRemote(idx)) {
      const rd = RemoteRefs.find(this._view.model.snapshot, idx);
      return rd
        ? esc(rd.peerName || 'Peer') + ' GPU ' + rd.index + ' ' + PlacementLanes._remoteBadge(rd)
        : 'Remote GPU <span class="adv-remote-badge off">unpaired</span>';
    }
    const dev = this._view.model.device(idx);
    const missing = !dev ? ' <span class="adv-remote-badge off">missing</span>' : '';
    return 'GPU ' + idx + ' <span class="adv-lane-meta">' + esc(PlacementText.shortName(dev ? dev.name : '')) + '</span>' + missing;
  }

  static _remoteBadge(rd) {
    return rd.online === false
      ? '<span class="adv-remote-badge off">offline</span>'
      : '<span class="adv-remote-badge">remote</span>';
  }

  _singularityActions(resId) {
    const wrap = Dom.el('div', 'adv-lane-actions');
    const b = Dom.el('button', 'adv-mini', '＋ Singularity');
    b.title = 'Members share this card: one loaded at a time';
    b.onclick = () => this._view.addSingularity(resId);
    wrap.appendChild(b);
    return wrap;
  }

  _appendSingularities(lane, resId) {
    for (const s of this._view.model.layout.singularities) {
      if (s.resource === resId) lane.appendChild(this._singularityBox(s));
    }
  }

  _singularityBox(s) {
    const box = Dom.el('div', 'adv-sing');
    box.dataset.sing = s.id;
    const mm = this._view.fit.singularityMax(s);
    const head = Dom.el('div', 'adv-sing-head', '<span><span class="adv-badge">one at a time</span> max '
      + (mm.bytes != null ? PlacementText.gb(mm.bytes) : 'n/a') + (mm.anyMissing ? ' · needs test' : '') + '</span>');
    const rm = Dom.el('button', 'adv-mini', 'Remove');
    rm.onclick = () => this._view.removeSingularity(s.id);
    head.appendChild(rm);
    box.appendChild(head);
    box.appendChild(Dom.el('div', 'adv-sing-chips'));
    this._wireDrop(box, { kind: 'singularity', id: s.id });
    return box;
  }

  _wireDrop(target, descriptor) {
    DropTargets.wire(target, descriptor, (itemKey, d) => this._view.drop(itemKey, d));
  }
}
