export default class DefaultModelServing {
  static of(defaults, frameworks, runtimes) {
    if (!defaults || !defaults.modelPath) return { runtimeId: null, runsOn: null };
    const current = DefaultModelServing._currentFor(defaults, frameworks);
    if (!current) return { runtimeId: DefaultModelServing._recorded(defaults, frameworks, runtimes), runsOn: null };
    if (current.runtimeId) {
      return { runtimeId: current.runtimeId, runsOn: { text: DefaultModelServing.runsOnText(frameworks.nameOf(current.frameworkId), frameworks.buildName(current.runtimeId)), missing: false } };
    }
    return { runtimeId: null, runsOn: { text: DefaultModelServing.missingText(current.frameworkId ? frameworks.nameOf(current.frameworkId) : ''), missing: true } };
  }

  static runsOnText(frameworkName, buildName) {
    if (!frameworkName || buildName.includes(frameworkName)) return `Runs on ${buildName}`;
    return `Runs on ${frameworkName} (${buildName})`;
  }

  static missingText(frameworkName) {
    return frameworkName
      ? `${frameworkName} runs this model, and no ${frameworkName} build is installed.`
      : 'No installed framework can run this model.';
  }

  static _currentFor(defaults, frameworks) {
    const current = frameworks.current();
    return current && current.modelPath === defaults.modelPath ? current : null;
  }

  static _recorded(defaults, frameworks, runtimes) {
    if (frameworks.view && frameworks.current() === null) return null;
    return defaults.runtimeId && runtimes.isInstalled(defaults.runtimeId) ? defaults.runtimeId : null;
  }
}
