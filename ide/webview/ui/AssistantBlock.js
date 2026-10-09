import MarkdownRenderer from '../../../core/llm-server/ui/js/markdown/MarkdownRenderer.js';
import PageDom from './PageDom.js';
import CodeDecorator from './CodeDecorator.js';

export default class AssistantBlock {
  constructor(transcript, host) {
    this._transcript = transcript;
    this._host = host;
    this._text = '';
    this._queued = false;
    this._sealed = false;
    this.node = transcript.push(PageDom.div('block asst'));
  }

  get text() {
    return this._text;
  }

  set text(value) {
    this._text = value;
    if (this._queued) return;
    this._queued = true;
    requestAnimationFrame(() => this._paint());
  }

  seal() {
    this._sealed = true;
    if (!this._text.trim()) this.node.remove();
    else this._paint();
  }

  _paint() {
    this._queued = false;
    this.node.innerHTML = MarkdownRenderer.render(this._text, { streaming: !this._sealed });
    CodeDecorator.decorate(this.node, this._host);
    this._transcript.autoscroll();
  }
}
