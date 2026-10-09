const CoreRequire = require('./CoreRequire');
const CodeModeDescriptor = require('./CodeModeDescriptor');
const TerminalBridge = require('./terminal/TerminalBridge');

const ExtensionGlobals = CoreRequire.require('shell/extensions/ExtensionGlobals');

class CodeModeExtension {
  static activate(context) {
    const sessions = new Map();
    context.chat.registerMode(CodeModeDescriptor.create(context, sessions));
    return { terminalBridge: CodeModeExtension.terminalBridge() };
  }

  static terminalBridge() {
    return new TerminalBridge({
      getRouter: () => ExtensionGlobals.chatRouter(),
      getAgentManager: () => global.__lumaAgentManager || null,
      getHandshake: () => global.__lumaCliHandshake || null,
      getLlmServer: () => ExtensionGlobals.llmServerService(),
    });
  }
}

module.exports = CodeModeExtension;
