class ActivationManual {
  static ACTIVATE = [
    'TOOL ACTIVATION:',
    'Some capabilities exist but their full instructions are not loaded yet, to',
    'keep this prompt short. Each is listed below as one line. Before you use',
    'one, load its instructions:',
    '- activate_tools: Load the detailed instructions for one or more tool groups',
    '  you need. Params: { "tool": "activate_tools", "params": { "groups":',
    '  ["images"] } }  (you may activate several at once).',
    '  • It returns the full usage docs for those groups right away (read them,',
    '    then make your call) and keeps them loaded for the rest of this',
    '    conversation, so a group is activated once.',
    '  • Shortcut: calling a tool whose group is not loaded yet loads the group',
    '    and returns its docs; then send your original call again, following',
    '    those docs.',
  ].join('\n');

  static ACTIVATE_NATIVE = [
    'TOOL ACTIVATION:',
    'Some capabilities exist but their full instructions are not loaded yet, to',
    'keep this prompt short. Each is listed below as one line. Before you use',
    'one, load its instructions:',
    '- activate_tools: Load the detailed instructions for one or more tool groups',
    '  you need: pass their keys in `groups`, for example ["images"] (you may',
    '  activate several at once).',
    '  • It returns the full usage docs for those groups right away (read them,',
    '    then make your call) and keeps them loaded for the rest of this',
    '    conversation, so a group is activated once.',
    '  • Shortcut: calling a tool whose group is not loaded yet loads the group',
    '    and returns its docs; then send your original call again, following',
    '    those docs.',
  ].join('\n');

  static INACTIVE_HEADING = 'INACTIVE tool groups you can activate right now:';

  static INACTIVE_DIRECTIVE = [
    'When a request matches one of these groups, use its tool: the chat shows',
    'what the tool makes (a document in the side panel, a working widget, a',
    'picture), which a code block, an ASCII mock-up or "here is the code" in',
    'your reply cannot do. An interactive widget, app, game or calculator goes',
    'to live_artifacts; a document, a page or a program to read goes to',
    'artifacts; a picture goes to images. You can call the tool directly: it',
    'loads its instructions, and you then send the call again. A short snippet',
    'or a quick answer the user will read in the reply stays in the reply.',
  ].join('\n');
}

module.exports = ActivationManual;
