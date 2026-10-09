import MarkdownRenderer from '../../llm-server/ui/js/markdown/MarkdownRenderer.js';
import StepLabels from './StepLabels.js';

export default class ReplyStream {
  constructor(bubble, { onScroll, requestFrame }) {
    this._asst = bubble;
    this._onScroll = onScroll;
    this._requestFrame = requestFrame;
    this._renderQueued = false;
    this._closed = false;
    this.text = '';
    this._showThinking();
  }

  append(text) {
    this.text += text;
    this._queueRender();
  }

  rollback(chars) {
    this.text = this.text.slice(0, Math.max(0, this.text.length - chars));
    this._queueRender();
  }

  addStep(tool, params) {
    const line = this._asst.steps.ownerDocument.createElement('div');
    line.className = 'od-step';
    line.dataset.tool = tool;
    line.textContent = StepLabels.label(tool, params);
    this._asst.steps.hidden = false;
    this._asst.steps.appendChild(line);
    this._onScroll();
    return line;
  }

  finishStep(tool, ok) {
    const line = [...this._asst.steps.querySelectorAll('.od-step')]
      .find((l) => l.dataset.tool === tool && !l.classList.contains('done') && !l.classList.contains('fail'));
    if (line) line.classList.add(ok === false ? 'fail' : 'done');
  }

  finish({ error, aborted } = {}) {
    this._closed = true;
    this._removeThinking();
    if (error) {
      this._asst.bubble.classList.add('error');
      this._asst.body.textContent = error;
    } else {
      if (!this.text.trim()) this.text = aborted ? 'Stopped.' : 'Done.';
      this._asst.body.innerHTML = MarkdownRenderer.render(this.text);
    }
    this._asst.steps.querySelectorAll('.od-step:not(.done):not(.fail)')
      .forEach((l) => l.classList.add(aborted || error ? 'fail' : 'done'));
  }

  abandon() {
    this._closed = true;
  }

  _showThinking() {
    const thinking = this._asst.body.ownerDocument.createElement('span');
    thinking.className = 'od-thinking';
    thinking.textContent = 'Thinking';
    this._asst.body.appendChild(thinking);
    this._asst.thinking = thinking;
  }

  _removeThinking() {
    if (!this._asst.thinking) return;
    this._asst.thinking.remove();
    this._asst.thinking = null;
  }

  _queueRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    this._requestFrame(() => {
      this._renderQueued = false;
      if (this._closed) return;
      this._removeThinking();
      this._asst.body.innerHTML = MarkdownRenderer.render(this.text, { streaming: true });
      this._onScroll();
    });
  }
}
