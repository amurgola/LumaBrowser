'use strict';

const vscode = require('vscode');
const LumaSession = require('./LumaSession');
const LumaViewProvider = require('./LumaViewProvider');
const FileSync = require('./FileSync');
const EditorContext = require('./EditorContext');
const AppExecutableLocator = require('./AppExecutableLocator');
const LumaSettings = require('./LumaSettings');
const LumaStatusBar = require('./LumaStatusBar');
const LumaCommands = require('./LumaCommands');
const ApprovalNotifier = require('./ApprovalNotifier');

class LumaExtension {
  static RESUME_KEY = 'luma.conversationId';

  constructor(context, connectLib) {
    this._context = context;
    this._connectLib = connectLib;
  }

  activate() {
    this._createOutput();
    if (!this._connectLib) { this._reportIncompleteBuild(); return; }
    this._createParts();
    new LumaCommands({ session: this._session, view: this._view, editorContext: this._editorContext }).register(this._context);
    this._subscribe();
    if (process.env.LUMA_DEV_OPEN === '1') this._view.reveal(true);
  }

  _createOutput() {
    this._out = vscode.window.createOutputChannel('Luma');
    this._log = (m) => this._out.appendLine(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
  }

  _reportIncompleteBuild() {
    vscode.window.showErrorMessage('LumaBrowser: this build of the extension is incomplete (lib/ is missing). Build it with "npm run build:vscode" in the LumaBrowser repository.');
    this._log('lib/ (the luma CLI connect library) is missing');
  }

  _createParts() {
    this._fileSync = new FileSync(LumaSettings.workspaceRoot);
    this._editorContext = new EditorContext(LumaSettings.workspaceRoot);
    this._session = new LumaSession(this._sessionOptions());
    this._view = new LumaViewProvider(this._context.extensionUri, this._session, this._fileSync, this._log);
    this._statusBar = new LumaStatusBar(this._session, `${LumaViewProvider.VIEW_ID}.focus`);
  }

  _sessionOptions() {
    const state = this._context.workspaceState;
    return {
      connectLib: this._connectLib,
      getRoot: LumaSettings.workspaceRoot,
      getSettings: LumaSettings.read,
      resolveExecutable: () => AppExecutableLocator.resolveExecutable({ fromSettings: LumaSettings.read().appExecutable }),
      clientName: `vscode/${vscode.env.appName} ${vscode.version}`,
      ideName: vscode.env.appName || 'VS Code',
      resumeId: state.get(LumaExtension.RESUME_KEY) || null,
      isTrusted: () => vscode.workspace.isTrusted,
      hooks: this._sessionHooks(),
    };
  }

  _sessionHooks() {
    const state = this._context.workspaceState;
    return {
      log: this._log,
      snapshot: (root, p) => this._fileSync.snapshot(root, p),
      afterWrite: (root, p, open) => { this._fileSync.afterWrite(root, p, open); },
      readContextText: (item) => this._editorContext.readContextText(item),
      saveConversationId: (id) => { state.update(LumaExtension.RESUME_KEY, id || undefined); },
      setApprovalSetting: (mode) => { LumaSettings.update('approval', mode); },
      notify: (level, message) => (level === 'warn' ? vscode.window.showWarningMessage : vscode.window.showInformationMessage)(`Luma: ${message}`),
      approvalPrompt: ApprovalNotifier.hook(() => !!(this._view && this._view.visible)),
    };
  }

  _subscribe() {
    const session = this._session;
    this._context.subscriptions.push(
      this._out, this._statusBar.item,
      vscode.window.registerWebviewViewProvider(LumaViewProvider.VIEW_ID, this._view, { webviewOptions: { retainContextWhenHidden: true } }),
      vscode.workspace.registerTextDocumentContentProvider(FileSync.BEFORE_SCHEME, this._fileSync.beforeProvider),
      vscode.workspace.onDidChangeConfiguration((e) => this._onConfigurationChanged(e)),
      vscode.workspace.onDidGrantWorkspaceTrust(() => { session.connect(); }),
      vscode.workspace.onDidChangeWorkspaceFolders(() => this._onFoldersChanged()),
      { dispose: () => session.dispose() },
    );
  }

  _onConfigurationChanged(e) {
    if (!e.affectsConfiguration('luma')) return;
    const mode = LumaSettings.read().approval === 'never' ? 'never' : 'ask';
    if (e.affectsConfiguration('luma.approval') && mode !== this._session.approval) this._session.setApproval(mode);
    else this._session.setState();
  }

  _onFoldersChanged() {
    if (LumaSettings.workspaceRoot() === this._session.root) return;
    this._session.disconnect();
    this._session.newSession();
  }
}

module.exports = LumaExtension;
