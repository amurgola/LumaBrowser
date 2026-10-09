class ChatModeIntent {
  static MODE_REQUIRED = 'mode is required';
  static TAB_UNAVAILABLE = 'The AI chat tab is not available. Enable the LLM feature first.';

  constructor(llmServerService) {
    this._svc = llmServerService;
  }

  start(intent) {
    if (!intent || !intent.mode) return { success: false, error: ChatModeIntent.MODE_REQUIRED };
    this._svc.setChatIntent({ mode: String(intent.mode), data: intent.data || {} });
    if (this._svc.openChat()) return { success: true, opened: true };
    this._svc.takeChatIntent();
    return { success: false, error: ChatModeIntent.TAB_UNAVAILABLE };
  }

  take() {
    try {
      return this._svc.takeChatIntent();
    } catch (_) {
      return null;
    }
  }
}

module.exports = ChatModeIntent;
