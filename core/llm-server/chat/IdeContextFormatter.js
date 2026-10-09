class IdeContextFormatter {
  static MAX_ITEMS = 12;
  static MAX_CHARS = 48 * 1024;
  static TRUNCATION_ROOM = 40;
  static PREAMBLE = 'The developer attached this from their editor. Treat it as the subject of the request unless they say otherwise.';

  static render(items) {
    if (!Array.isArray(items) || !items.length) return '';
    const parts = IdeContextFormatter._renderFiles(items.slice(0, IdeContextFormatter.MAX_ITEMS));
    if (!parts.length) return '';
    return `<ide_context>\n${IdeContextFormatter.PREAMBLE}\n${parts.join('\n')}\n</ide_context>`;
  }

  static appendToLastUserMessage(messages, items) {
    const block = IdeContextFormatter.render(items);
    if (!block || !Array.isArray(messages)) return messages;
    const at = IdeContextFormatter._lastUserIndex(messages);
    if (at === -1) return messages;
    const out = messages.slice();
    const text = out[at].content == null ? '' : String(out[at].content);
    out[at] = { ...out[at], content: text ? `${text}\n\n${block}` : block };
    return out;
  }

  static _renderFiles(items) {
    const parts = [];
    let budget = IdeContextFormatter.MAX_CHARS;
    for (const item of items) {
      const file = IdeContextFormatter._usableFile(item);
      if (!file) continue;
      const body = IdeContextFormatter._clip(file.text, budget);
      budget -= body.length;
      parts.push(IdeContextFormatter._fileTag(IdeContextFormatter._attributes(file, item), body));
      if (budget <= 0) break;
    }
    return parts;
  }

  static _usableFile(item) {
    if (!item || typeof item !== 'object') return null;
    const path = item.path ? String(item.path).trim() : '';
    const text = item.text == null ? '' : String(item.text);
    if (!path && !text.trim()) return null;
    return { path, text };
  }

  static _attributes(file, item) {
    const start = Number.isInteger(item.startLine) && item.startLine > 0 ? item.startLine : null;
    const end = Number.isInteger(item.endLine) && item.endLine >= (start || 1) ? item.endLine : null;
    const attrs = [];
    if (file.path) attrs.push(`path="${file.path.replace(/"/g, '&quot;')}"`);
    if (start) attrs.push(`lines="${start}${end && end !== start ? `-${end}` : ''}"`);
    if (item.kind === 'selection') attrs.push('kind="selection"');
    return attrs.join(' ');
  }

  static _clip(text, budget) {
    if (text.length <= budget) return text;
    return `${text.slice(0, Math.max(0, budget - IdeContextFormatter.TRUNCATION_ROOM))}\n… (truncated)`;
  }

  static _fileTag(attrs, body) {
    return body.trim() ? `<file ${attrs}>\n${body.replace(/\s+$/, '')}\n</file>` : `<file ${attrs} />`;
  }

  static _lastUserIndex(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i] && messages[i].role === 'user') return i;
    }
    return -1;
  }
}

module.exports = IdeContextFormatter;
