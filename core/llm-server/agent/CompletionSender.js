class CompletionSender {
  static SLOT_ID = 'ai-chat.navigator';
  static TEMPERATURE = 0.2;
  static MAX_TIMEOUT_MS = 300000;
  static COMPACT_TIMEOUT_MS = 120000;
  static MIN_COMPACT_TIMEOUT_MS = 1000;
  static WARMUP_RETRY_MS = 3000;
  static NOT_READY_MARKERS = ['500', 'econnrefused', 'failed', 'not configured'];

  constructor(llm, { label = null, clock }) {
    this._llm = llm;
    this._label = label;
    this._clock = clock;
  }

  send(messages) {
    return this._llm.sendCompletion(CompletionSender.SLOT_ID, messages, {
      temperature: CompletionSender.TEMPERATURE,
      timeout: Math.min(CompletionSender.MAX_TIMEOUT_MS, this._clock.remainingMs()),
      label: this._label,
    });
  }

  async sendFirst(messages) {
    const result = await this.send(messages);
    if (result.success || !CompletionSender._looksNotReady(result.error)) return result;
    await CompletionSender._wait(CompletionSender.WARMUP_RETRY_MS);
    return this.send(messages);
  }

  async summarize(promptMessages) {
    const result = await this._llm.sendCompletion(CompletionSender.SLOT_ID, promptMessages, {
      temperature: CompletionSender.TEMPERATURE,
      timeout: Math.min(CompletionSender.COMPACT_TIMEOUT_MS, Math.max(CompletionSender.MIN_COMPACT_TIMEOUT_MS, this._clock.remainingMs())),
      label: this._label,
      purpose: 'compact',
    });
    const text = result && result.success ? (result.response?.choices?.[0]?.message?.content || '') : '';
    return text && text.trim() ? text : null;
  }

  static _looksNotReady(error) {
    const text = String(error || '').toLowerCase();
    return CompletionSender.NOT_READY_MARKERS.some((marker) => text.includes(marker));
  }

  static _wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = CompletionSender;
