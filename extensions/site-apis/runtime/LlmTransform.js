const BalancedJson = require('../../../core/shared/llm/BalancedJson');

class LlmTransform {
  static TIMEOUT_MS = 60000;
  static MAX_INPUT_CHARS = 120000;
  static SYSTEM = 'You reshape JSON data exactly as instructed. Answer with one JSON object of the form {"result": ...} '
    + 'and nothing else: no prose, no code fence. Keep values as they are unless the instruction says otherwise.';

  constructor({ chat, logger = console }) {
    this._chat = chat;
    this._logger = logger;
  }

  async apply(step, result, { timeoutMs = LlmTransform.TIMEOUT_MS } = {}) {
    if (!this._chat || typeof this._chat.complete !== 'function') throw new Error('llm_transform needs the chat service');
    const input = JSON.stringify(result === undefined ? null : result);
    if (input.length > LlmTransform.MAX_INPUT_CHARS) throw new Error(`llm_transform input is too large (${input.length} chars)`);
    const reply = await this._chat.complete({
      messages: [{ role: 'system', content: LlmTransform.SYSTEM }, { role: 'user', content: LlmTransform.prompt(step, input) }],
      temperature: 0,
      noThink: true,
      timeoutMs,
      trace: 'site-apis:llm_transform',
    });
    if (!reply || reply.error) throw new Error(`llm_transform failed: ${(reply && reply.error) || 'no reply'}`);
    return LlmTransform.parse(reply.text);
  }

  static prompt(step, input) {
    const lines = [`Instruction: ${step.instruction}`];
    if (step.returns) lines.push(`Expected shape: ${typeof step.returns === 'string' ? step.returns : JSON.stringify(step.returns)}`);
    lines.push('', 'Current result JSON:', input);
    return lines.join('\n');
  }

  static parse(text) {
    const source = String(text || '');
    const start = source.indexOf('{');
    const json = start >= 0 ? BalancedJson.extractObject(source, start) : null;
    if (!json) throw new Error('llm_transform reply held no JSON object');
    let parsed;
    try { parsed = JSON.parse(json); } catch (err) { throw new Error(`llm_transform reply is not valid JSON: ${err.message}`); }
    return parsed && typeof parsed === 'object' && 'result' in parsed ? parsed.result : parsed;
  }
}

module.exports = LlmTransform;
