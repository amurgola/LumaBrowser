class ActivationManual {
  static ACTIVATE = [
    'TOOL ACTIVATION:',
    'Some capabilities exist but their full instructions are NOT loaded yet, to',
    'keep this prompt short. Each is listed below as one line. Before you can use',
    'one well, load it:',
    '- activate_tools: Load the detailed instructions for one or more tool groups',
    '  you need. Params: { "tool": "activate_tools", "params": { "groups":',
    '  ["images"] } }  (you may activate several at once).',
    '  • It returns the full usage docs for those groups IMMEDIATELY (read them,',
    '    then make your call) AND keeps them loaded for the rest of this',
    '    conversation, so you never re-activate the same group.',
    '  • Shortcut: if you call a not-yet-active tool directly, it AUTO-activates',
    '    and returns its docs; then just re-issue your original call following',
    '    those docs.',
  ].join('\n');

  static INACTIVE_HEADING = 'INACTIVE tool groups you can activate right now:';

  static INACTIVE_DIRECTIVE = [
    'IMPORTANT: match the user\'s request to a capability below and USE it; do',
    'not improvise the result without the tool. If they ask for an interactive',
    'widget / app / game / calculator → live_artifacts. A document/page/code to',
    'read → artifacts. A picture → images. When one matches, just CALL its tool',
    '(it auto-activates and returns its instructions; then re-issue your call).',
    'Do NOT answer such a request with a plain ```code block, an ASCII mock-up,',
    'or "here is the code" prose when a tool exists to actually render it.',
  ].join('\n');
}

module.exports = ActivationManual;
