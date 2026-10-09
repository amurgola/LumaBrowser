import Dom from '../dom/Dom.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class CodeEditorLayout {
  static build(root) {
    const els = {};
    const head = Dom.el('div', 'ce-head');
    els.title = Dom.el('div', 'ce-title', '<b>Code</b>');
    const actions = Dom.el('div', 'ce-actions');
    els.buttons = CodeEditorLayout._buttons(actions);
    els.status = Dom.el('div', 'ce-status');
    head.appendChild(els.title);
    head.appendChild(els.status);
    head.appendChild(actions);
    root.appendChild(head);
    root.appendChild(CodeEditorLayout._body(els));
    return els;
  }

  static _buttons(actions) {
    const make = (label, title, cls) => {
      const button = Dom.el('button', 'luma-btn luma-btn--sm' + (cls ? ' ' + cls : ''), HtmlEscaper.escape(label));
      button.type = 'button';
      button.title = title || label;
      actions.appendChild(button);
      return button;
    };
    const buttons = {
      newFile: make('New file', 'Create a file in the selected folder'),
      newDir: make('New folder', 'Create a folder'),
      refresh: make('Refresh', 'Re-read the folder from disk'),
      diff: make('Diff', 'Compare with the text before the agent last wrote this file'),
      chat: make('Chat', ''),
      save: make('Save', 'Save the open file (Ctrl+S)', 'primary'),
    };
    buttons.diff.disabled = true;
    return buttons;
  }

  static _body(els) {
    const body = Dom.el('div', 'ce-body');
    els.tree = Dom.el('div', 'ce-tree');
    const main = Dom.el('div', 'ce-main');
    els.tabs = Dom.el('div', 'ce-tabs');
    els.editorHost = Dom.el('div', 'ce-editor');
    els.imageHost = Dom.el('div', 'ce-image');
    els.imageHost.hidden = true;
    els.diffHost = Dom.el('div', 'ce-editor ce-diff');
    els.diffHost.hidden = true;
    main.appendChild(els.tabs);
    main.appendChild(els.editorHost);
    main.appendChild(els.diffHost);
    main.appendChild(els.imageHost);
    body.appendChild(els.tree);
    body.appendChild(main);
    return body;
  }
}
