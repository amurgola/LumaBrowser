const ThinkingVocabulary = require('./ThinkingVocabulary');

class ThinkingProbePlan {
  static buildShapes(nonce) {
    const user = (t) => ({ role: 'user', content: `${t} ${nonce}` });
    return {
      user: { messages: [user('Reply briefly.')] },
      system: { messages: [{ role: 'system', content: `You are a careful assistant. ${nonce}` }, user('Reply briefly.')] },
      history: {
        messages: [
          user('First question.'),
          { role: 'assistant', content: `First answer. ${nonce}`, reasoning_content: 'Earlier thoughts.' },
          user('Follow up.'),
        ],
      },
      tools: {
        messages: [user('Reply briefly.')],
        tools: [{
          type: 'function',
          function: { name: 'probe_tool', description: 'A tool that exists only for this probe.', parameters: { type: 'object', properties: {} } },
        }],
      },
    };
  }

  static buildPlan(invalid) {
    const plan = [];
    const add = (key, shape, kwargs) => plan.push({ key, shape, kwargs });
    for (const s of ThinkingVocabulary.SHAPES) add(`base:${s}`, s, {});
    for (const s of ThinkingVocabulary.SHAPES) add(`off:${s}`, s, { enable_thinking: false });
    for (const s of ['user', 'history']) add(`on:${s}`, s, { enable_thinking: true });
    for (const lv of ThinkingVocabulary.EFFORT_ORDER) add(`effort:${lv}:user`, 'user', { reasoning_effort: lv });
    for (const v of invalid) add(`invalid:${v}:user`, 'user', { reasoning_effort: v });
    return plan;
  }

  static historyEffortEntries() {
    return ['low', 'high'].map((lv) => ({ key: `effort:${lv}:history`, shape: 'history', kwargs: { reasoning_effort: lv } }));
  }

  static requestBody(shapes, entry) {
    const shape = shapes[entry.shape];
    const body = { messages: shape.messages };
    if (shape.tools) body.tools = shape.tools;
    if (entry.kwargs && Object.keys(entry.kwargs).length) body.chat_template_kwargs = entry.kwargs;
    return body;
  }
}

module.exports = ThinkingProbePlan;
