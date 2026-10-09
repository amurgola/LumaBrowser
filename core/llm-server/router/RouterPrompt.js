class RouterPrompt {
  static ROUTER_GROUPS = Object.freeze({
    web: 'search the live web or fetch an external URL for current or outside information (news, prices, weather, docs, what a site says)',
    images: 'generate a new picture or edit an existing image',
    video: 'make a video clip or animate a still image',
    music: 'compose a song with sung vocals / music audio',
    artifacts: 'write a standalone document or code file (script, HTML page, README, spec, CSV, long report) shown in a side panel',
    live_artifacts: 'build an interactive widget or mini-app the user can use (calculator, todo list, timer, game, dashboard with controls)',
    artifact_data: 'read or update the stored data of an existing widget, or schedule it to refresh on a timer',
    knowledge_base: "search the user's own uploaded documents, notes or PDFs",
    programmatic: 'send data to a webhook, URL endpoint, Slack or ntfy',
    tool_forge: 'build a new custom reusable chat tool',
  });

  static NONE_DESC = 'none of these: plain conversation, reasoning, math, rewriting pasted text, general knowledge, or driving the already-open browser tab (click, type, read page)';

  static SYSTEM = RouterPrompt._buildSystem();

  static GRAMMAR = RouterPrompt._buildGrammar();

  static MAX_MESSAGE_CHARS = 2000;

  static buildRouterPrompt(message) {
    const text = String(message || '').slice(0, RouterPrompt.MAX_MESSAGE_CHARS);
    return `<|im_start|>system\n${RouterPrompt.SYSTEM}<|im_end|>\n<|im_start|>user\n${text}<|im_end|>\n`
      + '<|im_start|>assistant\n<think>\n\n</think>\n\n';
  }

  static parseRouterAnswer(text) {
    const answer = String(text || '').trim();
    if (!answer || answer === 'none') return [];
    const keys = [];
    for (const part of answer.split(',')) {
      const key = part.trim();
      if (RouterPrompt._isGroup(key) && !keys.includes(key)) keys.push(key);
    }
    return keys;
  }

  static _isGroup(key) {
    return Object.prototype.hasOwnProperty.call(RouterPrompt.ROUTER_GROUPS, key);
  }

  static _buildSystem() {
    return 'Classify which tool groups the chat message needs. Groups:\n'
      + Object.entries(RouterPrompt.ROUTER_GROUPS).map(([key, desc]) => `${key}: ${desc}`).join('\n')
      + `\nnone: ${RouterPrompt.NONE_DESC}\n`
      + 'Answer with the needed group keys separated by commas, or none.';
  }

  static _buildGrammar() {
    return 'root ::= "none" | key ("," key)*\nkey ::= '
      + Object.keys(RouterPrompt.ROUTER_GROUPS).map((key) => `"${key}"`).join(' | ') + '\n';
  }
}

module.exports = RouterPrompt;
