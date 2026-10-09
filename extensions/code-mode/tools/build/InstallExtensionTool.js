const CodeTool = require('../CodeTool');

class InstallExtensionTool extends CodeTool {
  constructor(workspace) {
    super();
    this._workspace = workspace;
  }

  get name() {
    return 'install_extension';
  }

  get description() {
    return 'Validate the manifest + files and install/activate the extension live (no restart). '
      + 'Call this only after manifest.js, main.js, and any files the manifest references are written and clean.';
  }

  async handle(_params, opts = {}) {
    const s = this._workspace.current();
    if (!s) return { success: false, error: 'Nothing to install: write manifest.js and main.js first.' };
    this._setStatus(s, 'installing', opts.emit);
    const res = await this._workspace.code.installAndActivate(s.workspaceId);
    if (!res.ok) return this._failed(s, res, opts.emit);
    s.installedId = res.extensionId;
    this._setStatus(s, 'installed', opts.emit);
    return {
      success: true,
      extensionId: res.extensionId,
      message: `Installed and activated "${res.name || res.extensionId}" (id: ${res.extensionId}). `
        + 'It is now live in the app. Tell the user what it does and how to use it.',
    };
  }

  _failed(s, res, emit) {
    this._setStatus(s, 'error', emit);
    const detail = Array.isArray(res.errors) && res.errors.length ? '\n- ' + res.errors.join('\n- ') : '';
    return {
      success: false,
      error: res.error,
      message: `Install failed: ${res.error}${detail}\nFix the files and call install_extension again.`,
    };
  }

  _setStatus(s, status, emit) {
    s.status = status;
    this._workspace.emitState(emit, s);
  }
}

module.exports = InstallExtensionTool;
