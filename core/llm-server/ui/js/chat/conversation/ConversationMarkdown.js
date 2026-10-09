import TurnData from '../turns/TurnData.js';

export default class ConversationMarkdown {
  static build(conv, msgs) {
    const lines = ConversationMarkdown._header(conv);
    for (const m of msgs) ConversationMarkdown._appendMessage(lines, m);
    return lines.join('\n');
  }

  static _header(conv) {
    const L = ['# ' + (conv.title || 'Conversation'), '', '- Conversation ID: `' + conv.id + '`'];
    if (conv.modelRef) L.push('- Model: `' + conv.modelRef + '`');
    L.push('- Tools: ' + (conv.toolsEnabled ? 'on' : 'off'));
    if (conv.createdAt) L.push('- Created: ' + conv.createdAt);
    if (conv.updatedAt) L.push('- Updated: ' + conv.updatedAt);
    L.push('');
    return L;
  }

  static _appendMessage(L, m) {
    L.push('---', '', ConversationMarkdown._heading(m), '');
    if (TurnData.hasReasoning(m.reasoning)) ConversationMarkdown._appendReasoning(L, m.reasoning);
    const tc = m.toolCalls;
    if (tc && Array.isArray(tc.tools) && tc.tools.length) ConversationMarkdown._appendTools(L, tc.tools);
    if (tc && Array.isArray(tc.artifacts) && tc.artifacts.length) ConversationMarkdown._appendArtifacts(L, tc.artifacts);
    if (m.content && String(m.content).trim()) L.push(String(m.content).trim(), '');
    if (m.error) L.push('> error: ' + m.error, '');
  }

  static _heading(m) {
    const who = m.role === 'user' ? '## User' : m.role === 'assistant' ? '## Assistant' : '## ' + m.role;
    const meta = [];
    if (m.modelRef) meta.push(m.modelRef);
    if (m.tokensIn || m.tokensOut) meta.push('↑' + (m.tokensIn || 0) + ' ↓' + (m.tokensOut || 0) + ' tok');
    return who + (meta.length ? ' _(' + meta.join(' · ') + ')_' : '');
  }

  static _appendReasoning(L, reasoning) {
    L.push('<details><summary>reasoning</summary>', '', '```', String(reasoning).trim(), '```', '', '</details>', '');
  }

  static _appendTools(L, tools) {
    L.push('**Tool calls:**', '');
    for (const t of tools) L.push(ConversationMarkdown._toolLine(t));
    L.push('');
  }

  static _toolLine(t) {
    const mark = t.status === 'ok' ? '[ok]' : t.status === 'err' ? '[error]' : '[pending]';
    let line = '- ' + mark + ' `' + (t.tool || 'tool') + '`';
    if (t.params != null) {
      let p;
      try { p = JSON.stringify(t.params); } catch (_) { p = String(t.params); }
      if (p && p !== '{}' && p !== 'null') line += ' ' + p;
    }
    if (t.error) line += '. Error: ' + t.error;
    return line;
  }

  static _appendArtifacts(L, artifacts) {
    L.push('**Artifacts:**', '');
    for (const a of artifacts) {
      L.push('- ' + (a.title || 'Artifact') + ' (`' + (a.type || 'html') + '`)' + (a.id ? ', id `' + a.id + '`' : ''));
    }
    L.push('');
  }
}
