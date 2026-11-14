import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import PlacementChips from './PlacementChips.js';
import PlacementItems from './PlacementItems.js';

export default class PlacementRunningMarks {
  static LOADING_STATES = ['starting', 'loading'];
  static TITLE = 'Where this model is loaded right now. Drag its chip onto a card to keep it there.';

  constructor(view) {
    this._view = view;
  }

  distribute(root) {
    for (const item of PlacementItems.ITEMS) {
      for (const laneId of this._lanesToMark(item.key)) {
        const lane = PlacementChips.container(root, { kind: 'resource', id: laneId });
        if (lane) lane.appendChild(this.mark(item));
      }
    }
  }

  mark(item) {
    const slot = this._slot(item.key);
    const loading = PlacementRunningMarks.LOADING_STATES.includes(slot.state);
    const mark = Dom.el('span', 'adv-running ' + item.cls,
      '<span class="dot ' + (slot.offloadToCpu ? 'offload' : 'ready') + '"></span>'
      + '<span>' + HtmlEscaper.escape(item.label) + '</span>'
      + '<span class="sz">' + (loading ? 'loading here' : 'running here') + (slot.offloadToCpu ? ', partly in RAM' : '') + '</span>');
    mark.dataset.running = item.key;
    mark.title = PlacementRunningMarks.TITLE;
    return mark;
  }

  _lanesToMark(itemKey) {
    const slot = this._slot(itemKey);
    const live = slot.state === 'ready' || PlacementRunningMarks.LOADING_STATES.includes(slot.state);
    if (!live || !Array.isArray(slot.devices)) return [];
    const chipLane = this._view.model.effectiveResourceId(itemKey);
    const lanes = slot.devices.map((card) => this._laneOfCard(card));
    return [...new Set(lanes)].filter((laneId) => laneId !== chipLane);
  }

  _laneOfCard(card) {
    const group = (this._view.model.layout.resources || []).find((r) => r.kind === 'gpu-group' && r.devices.includes(card));
    return group ? group.id : 'g' + card;
  }

  _slot(itemKey) {
    return (this._view.model.snapshot.servers && this._view.model.snapshot.servers[itemKey]) || {};
  }
}
