class ActivationManual {
  static ACTIVATE = [
    'TOOL ACTIVATION:',
    'Some capabilities exist but their full instructions are not loaded yet, to',
    'keep this prompt short. Each is listed below as one line. To use one, call',
    'its tool directly: the group loads by itself, the call runs, and the',
    'instructions come back with its result for the calls that follow. A call',
    'that starts a render (images, video, music) is the exception: it is sent',
    'back with the instructions first, and you send it again following them.',
    '- activate_tools: Load the detailed instructions for one or more tool groups',
    '  without acting yet, for when you want to read them before you decide.',
    '  Params: { "tool": "activate_tools", "params": { "groups": ["images"] } }',
    '  (you may activate several at once). It returns the full usage docs right',
    '  away and keeps them loaded for the rest of this conversation, so a group',
    '  is activated once.',
  ].join('\n');

  static ACTIVATE_NATIVE = [
    'TOOL ACTIVATION:',
    'Some capabilities exist but their full instructions are not loaded yet, to',
    'keep this prompt short. Each is listed below as one line. To use one, run',
    'its tool with call_tool: the group loads by itself, the call runs, and the',
    'instructions come back with its result for the calls that follow. A call',
    'that starts a render (images, video, music) is the exception: it is sent',
    'back with the instructions first, and you send it again following them.',
    '- call_tool: Runs a tool that is not one of your registered functions: pass',
    '  the tool\'s name in `name` and its parameters in `params`.',
    '- activate_tools: Load the detailed instructions for one or more tool groups',
    '  without acting yet, for when you want to read them before you decide:',
    '  pass their keys in `groups`, for example ["images"] (you may activate',
    '  several at once). It returns the full usage docs right away and keeps',
    '  them loaded for the rest of this conversation, so a group is activated',
    '  once.',
  ].join('\n');

  static CALL_THROUGH_CALL_TOOL = 'These tools are not among your registered functions. Call each of them through '
    + 'call_tool: `name` is the tool\'s name and `params` its parameters, as described above.';

  static INACTIVE_HEADING = 'INACTIVE tool groups you can activate right now:';

  static INACTIVE_DIRECTIVE = [
    'When a request matches one of these groups, use its tool: the chat shows',
    'what the tool makes (a document in the side panel, a working widget, a',
    'picture), which a code block, an ASCII mock-up or "here is the code" in',
    'your reply cannot do. An interactive widget, app, game or calculator goes',
    'to live_artifacts; a document, a page or a program to read goes to',
    'artifacts; a picture goes to images. You can call the tool directly: its',
    'group loads by itself. A short snippet or a quick answer the user will',
    'read in the reply stays in the reply.',
  ].join('\n');

  static INACTIVE_DIRECTIVE_NATIVE = ActivationManual.INACTIVE_DIRECTIVE.replace(
    'You can call the tool directly: its\ngroup loads by itself.',
    'Run its tool with call_tool: its\ngroup loads by itself.',
  );
}

module.exports = ActivationManual;
