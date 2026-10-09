import TaskChrome from './TaskChrome.js';
import WidgetDom from './WidgetDom.js';

export default class StatusPicker {
  constructor(root) {
    this._root = root;
    this._el = null;
    this._resolve = null;
  }

  isOpen() {
    return !!this._el;
  }

  pick({ taskTitle = '', columnTitle = '', where = '', statuses = [] } = {}) {
    this.close();
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._el = WidgetDom.el('div', { class: 'hub-picker-backdrop', on: { click: (e) => { if (e.target === this._el) this.close(); } } }, [
        WidgetDom.el('div', { class: 'hub-picker', role: 'dialog', 'aria-label': `Pick a ClickUp status for ${columnTitle}` }, [
          WidgetDom.el('div', { class: 'hub-section-label', text: where || 'ClickUp' }),
          WidgetDom.el('h3', { class: 'hub-picker-title', text: `Which status is "${columnTitle}"?` }),
          WidgetDom.el('p', {
            class: 'hub-sub hub-picker-help',
            text: `"${taskTitle}" needs a ClickUp status to move. The one you pick is linked to ${columnTitle}, so tasks with it show there from now on.`,
          }),
          WidgetDom.el('div', { class: 'hub-picker-list' }, statuses.length
            ? statuses.map((s) => this._option(s, columnTitle))
            : [WidgetDom.el('div', { class: 'hub-empty', text: 'ClickUp did not return the statuses of this list. Try again after the next sync.' })]),
          WidgetDom.el('div', { class: 'hub-picker-actions' }, [
            WidgetDom.el('button', { class: 'hub-btn hub-picker-cancel', text: 'Cancel', on: { click: () => this.close() } }),
          ]),
        ]),
      ]);
      this._root.appendChild(this._el);
      const first = this._el.querySelector('.hub-picker-option');
      if (first) first.focus();
    });
  }

  close(value = null) {
    if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el);
    this._el = null;
    const resolve = this._resolve;
    this._resolve = null;
    if (resolve) resolve(value);
  }

  _option(s, columnTitle) {
    const elsewhere = s.columnTitle && s.columnTitle !== columnTitle;
    return WidgetDom.el('button', {
      class: 'hub-picker-option',
      data: { status: s.status },
      on: { click: () => this.close(s.status) },
    }, [
      TaskChrome.statusPill({ remoteStatus: s.status, remoteStatusColor: s.color, sourceLabel: 'ClickUp' }),
      WidgetDom.el('span', {
        class: 'hub-sub',
        text: elsewhere ? `now in ${s.columnTitle}; its tasks move here` : (s.columnTitle ? 'already here' : 'not linked yet'),
      }),
    ]);
  }
}
