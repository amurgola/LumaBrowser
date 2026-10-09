import PageDom from './PageDom.js';

export default class CodeDecorator {
  static COPIED_MS = 1200;

  static decorate(root, host) {
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.codehead')) return;
      const head = PageDom.div('codehead');
      head.append(CodeDecorator._copyButton(pre, host), CodeDecorator._insertButton(pre, host));
      pre.appendChild(head);
    });
  }

  static _copyButton(pre, host) {
    const copy = document.createElement('button');
    copy.textContent = 'copy';
    copy.addEventListener('click', () => {
      host.send('copy', { text: pre.textContent });
      copy.textContent = 'copied';
      setTimeout(() => { copy.textContent = 'copy'; }, CodeDecorator.COPIED_MS);
    });
    return copy;
  }

  static _insertButton(pre, host) {
    const ins = document.createElement('button');
    ins.textContent = 'insert';
    ins.title = 'Insert at the caret in the editor';
    ins.addEventListener('click', () => host.send('insert', { text: pre.textContent }));
    return ins;
  }
}
