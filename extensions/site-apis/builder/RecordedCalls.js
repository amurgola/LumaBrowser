class RecordedCalls {
  static DEFINE_TOOL = 'define_endpoint';
  static COMPILE_TOOL = 'compile_endpoint';

  static collect(chatStore, conversationId, marker = {}, options = {}) {
    const persisted = RecordedCalls.since(chatStore, conversationId, marker, { excludeMessageId: options.excludeMessageId });
    return [...persisted, ...RecordedCalls.live(options.trace, marker, options.excludeMessageId)];
  }

  static live(trace, marker = {}, messageId = null) {
    const entries = trace && Array.isArray(trace.entries) ? trace.entries.filter(Boolean) : [];
    if (!entries.length) return [];
    const scoped = marker.messageId && messageId && marker.messageId === messageId
      ? RecordedCalls._afterDefine(entries, marker.name)
      : RecordedCalls._afterDefineIfPresent(entries, marker.name);
    return scoped
      .filter((entry) => entry.status === 'ok' && entry.tool !== RecordedCalls.COMPILE_TOOL)
      .map((entry) => RecordedCalls._call(entry, messageId));
  }

  static since(chatStore, conversationId, marker = {}, options = {}) {
    const messages = RecordedCalls._messages(chatStore, conversationId);
    const calls = [];
    let started = !marker.messageId && !marker.at;
    for (const message of messages) {
      if (!message || message.role !== 'assistant') continue;
      if (options.excludeMessageId && message.id === options.excludeMessageId) continue;
      const entries = RecordedCalls.entriesOf(message);
      if (!started && marker.messageId && message.id === marker.messageId) {
        started = true;
        calls.push(...RecordedCalls._afterDefine(entries, marker.name).map((e) => RecordedCalls._call(e, message.id)));
        continue;
      }
      if (!started && !marker.messageId && marker.at && message.createdAt && message.createdAt >= marker.at) started = true;
      if (!started) continue;
      calls.push(...entries.map((e) => RecordedCalls._call(e, message.id)));
    }
    if (!started && marker.messageId && marker.at) {
      return RecordedCalls.since(chatStore, conversationId, { at: marker.at, name: marker.name }, options);
    }
    return calls;
  }

  static entriesOf(message) {
    const trace = message && message.toolCalls;
    if (!trace) return [];
    if (Array.isArray(trace)) return trace.filter(Boolean);
    return Array.isArray(trace.tools) ? trace.tools.filter(Boolean) : [];
  }

  static _afterDefine(entries, name) {
    let index = -1;
    entries.forEach((entry, i) => {
      if (entry.tool !== RecordedCalls.DEFINE_TOOL) return;
      if (!name || !entry.params || entry.params.name === name) index = i;
    });
    return entries.slice(index + 1);
  }

  static _afterDefineIfPresent(entries, name) {
    const defines = entries.some((e) => e.tool === RecordedCalls.DEFINE_TOOL && (!name || !e.params || e.params.name === name));
    return defines ? RecordedCalls._afterDefine(entries, name) : entries;
  }

  static _call(entry, messageId) {
    return {
      tool: entry.tool,
      params: entry.params || {},
      success: entry.status ? entry.status === 'ok' : entry.success !== false,
      error: entry.error || null,
      messageId,
    };
  }

  static _messages(chatStore, conversationId) {
    if (!chatStore || !conversationId) return [];
    try {
      const list = typeof chatStore.listActiveMessages === 'function'
        ? chatStore.listActiveMessages(conversationId)
        : chatStore.listMessages(conversationId);
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }
}

module.exports = RecordedCalls;
