import Dom from '../../../../../llm-server/ui/js/dom/Dom.js';
import HtmlEscaper from '../../../../../llm-server/ui/js/format/HtmlEscaper.js';
import MarkdownRenderer from '../../../../../llm-server/ui/js/markdown/MarkdownRenderer.js';
import AttachmentParser from '../../../../../llm-server/ui/js/markdown/AttachmentParser.js';
import AttachmentCard from '../../../../../llm-server/ui/js/chat/turns/AttachmentCard.js';

export default class ShareTurnView {
  constructor(artifacts) {
    this._artifacts = artifacts;
  }

  render(message) {
    return message.role === 'user' ? this._user(message) : this._assistant(message);
  }

  _user(m) {
    const turn = Dom.el('div', 'cm-turn user');
    const parsed = AttachmentParser.parse(m.content || '');
    for (const att of parsed.attachments) {
      if (att.kind !== 'image') turn.appendChild(AttachmentCard.create(att));
    }
    if (parsed.text.trim() || !parsed.attachments.length) {
      const bubble = Dom.el('div', 'cm-user-bubble');
      bubble.textContent = parsed.text;
      turn.appendChild(bubble);
    }
    this._appendArtifacts(turn, m);
    return turn;
  }

  _assistant(m) {
    const turn = Dom.el('div', 'cm-turn assistant');
    const asst = Dom.el('div', 'cm-asst');
    const body = Dom.el('div', 'cm-asst-body');
    body.innerHTML = MarkdownRenderer.render(m.content || '');
    asst.appendChild(body);
    this._appendArtifacts(asst, m);
    if (m.error) asst.appendChild(Dom.el('div', 'sv-error', HtmlEscaper.escape('[' + m.error + ']')));
    turn.appendChild(asst);
    return turn;
  }

  _appendArtifacts(parent, m) {
    const artifacts = Array.isArray(m.artifacts) ? m.artifacts : [];
    for (const node of this._artifacts.elements(artifacts)) parent.appendChild(node);
  }
}
