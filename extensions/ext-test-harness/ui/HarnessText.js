export default class HarnessText {
  static formatTime(iso) {
    if (!iso) return 'Never';
    try {
      const date = new Date(iso);
      return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  }

  static formatDuration(ms) {
    if (!ms && ms !== 0) return '';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  static parseJson(text) {
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  static roleLabel(role) {
    if (role === 'system') return 'System';
    if (role === 'assistant') return 'Assistant';
    return 'User/Tool';
  }

  static detailParts(run, detail) {
    const fullLog = detail.fullLog || {};
    return {
      assertions: detail.assertions || HarnessText.parseJson(run.assertions) || [],
      fullLog,
      toolCalls: fullLog.toolCalls || [],
      notes: fullLog.notes || [],
      conversation: fullLog.conversationHistory || [],
    };
  }
}
