class TurnReminder {
  static FORMAT = [
    '<tool_format_reminder>',
    'To act, reply with ONE fenced tool block and nothing else:',
    '```tool',
    '{"tool": "<name>", "params": {…}}',
    '```',
    'To finish, reply normally with no tool block.',
    '</tool_format_reminder>',
  ].join('\n');

  static FORMAT_PARALLEL = [
    '<tool_format_reminder>',
    'To act, reply with a fenced tool block and nothing else:',
    '```tool',
    '{"tool": "<name>", "params": {…}}',
    '```',
    'You may send several blocks in one reply ONLY for independent read-only lookups.',
    'Send exactly one when it changes something, or when the next call depends on its result.',
    'To finish, reply normally with no tool block.',
    '</tool_format_reminder>',
  ].join('\n');

  static CORRECTION = [
    '<tool_format_reminder>',
    'Your last tool call was NOT in the required format and had to be repaired.',
    'Use ONLY this shape: no XML tags (<tool_call>, <function=…>), no bare JSON:',
    '```tool',
    '{"tool": "<name>", "params": {…}}',
    '```',
    'To finish, reply normally with no tool block.',
    '</tool_format_reminder>',
  ].join('\n');

  static compose({ turnReminder = null, nativeTools = false, offFormat = false, parallel = false } = {}) {
    const format = nativeTools ? null : TurnReminder._formatBlock(offFormat, parallel);
    return [turnReminder, format].filter(Boolean).join('\n\n') || null;
  }

  static append(msgs, reminder) {
    if (!reminder || !Array.isArray(msgs) || !msgs.length) return msgs;
    const last = msgs[msgs.length - 1];
    if (!last || typeof last.content !== 'string') return [...msgs, { role: 'user', content: reminder }];
    return [...msgs.slice(0, -1), { ...last, content: `${last.content}\n\n${reminder}` }];
  }

  static _formatBlock(offFormat, parallel) {
    if (offFormat) return TurnReminder.CORRECTION;
    return parallel ? TurnReminder.FORMAT_PARALLEL : TurnReminder.FORMAT;
  }
}

module.exports = TurnReminder;
