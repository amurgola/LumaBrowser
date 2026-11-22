const FrameworksView = require('../runtimes/FrameworksView');

class LlmFrameworks {
  static IDLE = 'idle';

  constructor({ llmServerService }) {
    this._svc = llmServerService;
  }

  async view() {
    return { view: await this._buildView() };
  }

  setActiveBuild(frameworkId, runtimeId) {
    this._svc.frameworkSelection.setActiveBuild(frameworkId, runtimeId);
    return this._afterSelectionChange();
  }

  setFormatFramework(format, frameworkId) {
    this._svc.frameworkSelection.setFormatFramework(format, frameworkId);
    return this._afterSelectionChange();
  }

  setModelFramework(modelPath, frameworkId) {
    this._svc.frameworkSelection.setModelFramework(modelPath, frameworkId);
    return this._afterSelectionChange();
  }

  async setOption(frameworkId, optionId, value) {
    this._svc.frameworkOptions.set(frameworkId, optionId, value);
    const current = await this._svc.runtimeFollower.resolve();
    const serverStopped = !!current && current.frameworkId === frameworkId && await this._stopServer();
    return { view: await this._buildView(current), serverStopped };
  }

  async _afterSelectionChange() {
    const followed = await this._svc.runtimeFollower.follow();
    const serverStopped = !!followed && followed.changed && await this._stopServer();
    return { view: await this._buildView(followed), serverStopped };
  }

  async _stopServer() {
    const server = this._svc.runtimeServer;
    if (!server || server.getStatus().state === LlmFrameworks.IDLE) return false;
    await server.stop();
    return true;
  }

  async _buildView(current) {
    const runtimesView = await this._svc.ensureRuntimesView();
    const diagnostics = await this._svc.ensureDiagnostics();
    const options = this._svc.frameworkOptions;
    return FrameworksView.build({
      rows: (runtimesView && runtimesView.runtimes) || [],
      selection: this._svc.frameworkSelection,
      legacyRuntimeId: this._svc.getDefaults().runtimeId,
      order: this._svc.runtimeChooser.buildOrder(diagnostics, runtimesView),
      describeOptions: (framework, build) => (typeof options.describe === 'function' ? options.describe(framework, build) : []),
      current: current === undefined ? await this._svc.runtimeFollower.resolve() : LlmFrameworks._currentOf(current),
    });
  }

  static _currentOf(followed) {
    if (!followed) return null;
    const { modelPath, runtimeId, frameworkId, why } = followed;
    return { modelPath, runtimeId, frameworkId, why };
  }
}

module.exports = LlmFrameworks;
