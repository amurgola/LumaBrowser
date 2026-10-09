class EmptyReplyDiagnostic {
  static FULL_DUMP_CHARS = 4000;

  static summarize(r) {
    const choice = r.choices?.[0];
    return {
      topLevelKeys: Object.keys(r || {}),
      choicesLen: Array.isArray(r.choices) ? r.choices.length : null,
      choice0Keys: choice ? Object.keys(choice) : null,
      choice0FinishReason: choice?.finish_reason || choice?.finishReason || null,
      messageKeys: choice?.message ? Object.keys(choice.message) : null,
      messageContentType: typeof choice?.message?.content,
      messageContentPreview: EmptyReplyDiagnostic._contentPreview(choice?.message?.content),
      contentTopKeys: EmptyReplyDiagnostic._contentKinds(r.content),
      stopReason: r.stop_reason || r.stopReason || null,
      usage: r.usage || null,
    };
  }

  static fullDump(r) {
    let dump;
    try {
      dump = JSON.stringify(r);
    } catch (_) {
      dump = String(r);
    }
    return dump.slice(0, EmptyReplyDiagnostic.FULL_DUMP_CHARS);
  }

  static _contentPreview(content) {
    if (typeof content === 'string') return content.slice(0, 200);
    if (Array.isArray(content)) return JSON.stringify(content).slice(0, 400);
    return null;
  }

  static _contentKinds(content) {
    if (!content) return null;
    return Array.isArray(content) ? content.map((b) => b?.type || typeof b) : typeof content;
  }
}

module.exports = EmptyReplyDiagnostic;
