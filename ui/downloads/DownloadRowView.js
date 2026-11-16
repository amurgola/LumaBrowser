import DownloadText from './DownloadText.js';
import FileKind from './FileKind.js';

export default class DownloadRowView {
  static SVG = 'http://www.w3.org/2000/svg';

  static build(doc, d) {
    const row = doc.createElement('li');
    row.className = `dl-row is-${d.state}${d.missing ? ' is-missing' : ''}`;
    row.dataset.id = String(d.id);
    row.dataset.shape = DownloadRowView._shape(d);
    row.append(
      DownloadRowView._icon(doc, `dl-kind-${FileKind.of(DownloadText.name(d))}`, 'dl-kind'),
      DownloadRowView._main(doc, d),
      DownloadRowView._actions(doc, d),
    );
    return row;
  }

  static refresh(row, d) {
    if (row.dataset.shape !== DownloadRowView._shape(d)) return false;
    row.querySelector('.dl-status').textContent = DownloadText.pageStatus(d);
    const fill = row.querySelector('.dl-fill');
    if (fill && d.total) fill.style.width = `${DownloadText.percent(d)}%`;
    return true;
  }

  static _shape(d) {
    return [d.state, d.missing ? 'missing' : 'present', d.total ? 'sized' : 'unsized', DownloadText.name(d)].join('|');
  }

  static _main(doc, d) {
    const main = doc.createElement('div');
    main.className = 'dl-main';
    main.append(DownloadRowView._name(doc, d), DownloadRowView._meta(doc, d));
    if (d.state === 'progress') main.append(DownloadRowView._bar(doc, d));
    return main;
  }

  static _name(doc, d) {
    const openable = d.state === 'done' && !d.missing;
    const name = doc.createElement(openable ? 'button' : 'span');
    name.className = 'dl-name';
    name.textContent = DownloadText.name(d);
    name.title = d.savePath || d.url || '';
    if (openable) {
      name.type = 'button';
      name.dataset.action = 'open';
    }
    return name;
  }

  static _meta(doc, d) {
    const meta = doc.createElement('div');
    meta.className = 'dl-meta';
    meta.append(DownloadRowView._text(doc, 'dl-status', DownloadText.pageStatus(d)));
    const source = DownloadText.source(d);
    if (source) meta.append(DownloadRowView._text(doc, 'dl-source', source));
    return meta;
  }

  static _bar(doc, d) {
    const bar = doc.createElement('div');
    bar.className = `dl-bar${d.total ? '' : ' is-indeterminate'}`;
    const fill = doc.createElement('div');
    fill.className = 'dl-fill';
    if (d.total) fill.style.width = `${DownloadText.percent(d)}%`;
    bar.append(fill);
    return bar;
  }

  static _actions(doc, d) {
    const actions = doc.createElement('div');
    actions.className = 'dl-actions';
    if (d.url) actions.append(DownloadRowView._iconButton(doc, 'copy', 'dl-act-link', 'Copy download link'));
    if (d.state === 'progress') {
      actions.append(DownloadRowView._cancelButton(doc));
      return actions;
    }
    if (d.state === 'done' && !d.missing) actions.append(DownloadRowView._iconButton(doc, 'folder', 'dl-act-folder', 'Show in folder'));
    actions.append(DownloadRowView._iconButton(doc, 'remove', 'dl-act-remove', 'Remove from list'));
    return actions;
  }

  static _iconButton(doc, action, iconId, label) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'dl-act';
    button.dataset.action = action;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.append(DownloadRowView._icon(doc, iconId, 'dl-act-icon'));
    return button;
  }

  static _cancelButton(doc) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'dl-button';
    button.dataset.action = 'cancel';
    button.textContent = 'Cancel';
    return button;
  }

  static _icon(doc, id, className) {
    const svg = doc.createElementNS(DownloadRowView.SVG, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    const use = doc.createElementNS(DownloadRowView.SVG, 'use');
    use.setAttribute('href', `#${id}`);
    svg.append(use);
    return svg;
  }

  static _text(doc, className, text) {
    const span = doc.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  }
}
