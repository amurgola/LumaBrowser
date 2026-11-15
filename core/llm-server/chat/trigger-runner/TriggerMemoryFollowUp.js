const TriggerMemoryPolicy = require('../trigger-store/TriggerMemoryPolicy');
const ThinkingText = require('../../../shared/text/ThinkingText');

class TriggerMemoryFollowUp {
  static TOOL = 'save_memory';
  static NOTHING = 'NONE';
  static TIMEOUT_MS = 60 * 1000;
  static EVENT_CHARS = 2000;
  static RESPONSE_CHARS = 2000;
  static SUMMARY = 'Saved after the run: the model had not called save_memory.';
  static SYSTEM = 'You keep the notes a background automation remembers between its runs. Reply with the notes only, '
    + 'as plain text, with no preamble and no commentary.';

  constructor({ complete, triggerStore, emitEvent = () => {}, log = console }) {
    this._complete = complete;
    this._store = triggerStore;
    this._emitEvent = emitEvent;
    this._log = log;
  }

  async save({ trigger, modelRef, event, response }) {
    const policy = TriggerMemoryPolicy.of(trigger);
    if (!policy) return null;
    try {
      const notes = await this._writeNotes(trigger, policy, { modelRef, event, response });
      if (!notes) return null;
      this._store.setMemory(trigger.id, notes);
      this._emitEvent('triggers-changed', { triggerId: trigger.id });
      return { tool: TriggerMemoryFollowUp.TOOL, params: { notes }, status: 'ok', error: null, summary: TriggerMemoryFollowUp.SUMMARY };
    } catch (err) {
      this._log.warn(`[triggers] memory follow-up failed for ${trigger.id}:`, err && err.message);
      return null;
    }
  }

  async _writeNotes(trigger, policy, { modelRef, event, response }) {
    const result = await this._complete({
      messages: [
        { role: 'system', content: TriggerMemoryFollowUp.SYSTEM },
        { role: 'user', content: this._request(trigger, policy, event, response) },
      ],
      modelRef: modelRef || undefined,
      temperature: 0.2,
      timeoutMs: TriggerMemoryFollowUp.TIMEOUT_MS,
      noThink: true,
    });
    if (!result || typeof result.text !== 'string') throw new Error((result && result.error) || 'the model gave no answer');
    const notes = ThinkingText.strip(result.text);
    return notes && notes.toUpperCase() !== TriggerMemoryFollowUp.NOTHING ? notes : null;
  }

  _request(trigger, policy, event, response) {
    const current = this._store.get(trigger.id);
    const notes = current && current.memory ? String(current.memory).trim() : '';
    return [
      'Notes so far:',
      notes || '(no notes yet)',
      '',
      'This run received:',
      TriggerMemoryFollowUp._clip(TriggerMemoryFollowUp._text(event), TriggerMemoryFollowUp.EVENT_CHARS),
      '',
      'It answered:',
      TriggerMemoryFollowUp._clip(response, TriggerMemoryFollowUp.RESPONSE_CHARS) || '(nothing)',
      '',
      `Write the COMPLETE updated notes (up to ${policy.maxChars} characters): who asked what, what was answered or done,`,
      'open items, preferences. Rewrite, do not append blindly; drop what is stale. Always record this run, in a line',
      'if it was routine. When it adds nothing to notes that already cover it, return those notes unchanged.',
    ].join('\n');
  }

  static _text(value) {
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value == null ? {} : value, null, 2); } catch (_) { return String(value); }
  }

  static _clip(text, max) {
    const s = String(text == null ? '' : text);
    return s.length > max ? `${s.slice(0, max)} [cut]` : s;
  }
}

module.exports = TriggerMemoryFollowUp;
