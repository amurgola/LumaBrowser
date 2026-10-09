import HtmlEscaper from '../format/HtmlEscaper.js';
import CodeIcons from './CodeIcons.js';
import WorkspacePath from './WorkspacePath.js';

const esc = HtmlEscaper.escape;

export default class EditorTabs {
  static render(element, openFiles) {
    if (!openFiles.size) { element.innerHTML = ''; element.hidden = true; return; }
    element.hidden = false;
    element.innerHTML = openFiles.entries().map(([path, file]) => EditorTabs._tab(path, file, path === openFiles.activePath)).join('');
  }

  static _tab(path, file, active) {
    return `<div class="ce-tab${active ? ' ce-tab--active' : ''}" data-path="${esc(path)}" title="${esc(path)}">`
      + `<span class="ce-tab-name">${esc(WorkspacePath.baseName(path))}</span>`
      + `<span class="ce-tab-dot" ${file.dirty ? '' : 'hidden'}>●</span>`
      + `<button type="button" class="ce-tab-x" data-close="${esc(path)}" title="Close">${CodeIcons.CLOSE}</button>`
      + '</div>';
  }
}
