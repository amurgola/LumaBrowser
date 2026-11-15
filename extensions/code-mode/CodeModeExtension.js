const CoreRequire = require('./CoreRequire');
const CodeModeDescriptor = require('./CodeModeDescriptor');
const TerminalBridge = require('./terminal/TerminalBridge');
const DockedTabs = require('./turn/DockedTabs');

const ExtensionGlobals = CoreRequire.require('shell/extensions/ExtensionGlobals');

class CodeModeExtension {
  static activate(context) {
    const sessions = new Map();
    const dockedTabs = new DockedTabs();
    context.chat.registerMode(CodeModeDescriptor.create(context, sessions, dockedTabs));
    return { terminalBridge: CodeModeExtension.terminalBridge(dockedTabs) };
  }

  static terminalBridge(dockedTabs = new DockedTabs()) {
    return new TerminalBridge({
      dockedTabs,
      getRouter: () => ExtensionGlobals.chatRouter(),
      getAgentManager: () => global.__lumaAgentManager || null,
      getHandshake: () => global.__lumaCliHandshake || null,
      getLlmServer: () => ExtensionGlobals.llmServerService(),
    });
  }
}

module.exports = CodeModeExtension;
