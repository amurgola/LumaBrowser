const path = require('path');
const ShellClassifier = require('../../../shell/shellClassifier/ShellClassifier');
const ShellWriteBoundary = require('../../../shell/shellClassifier/ShellWriteBoundary');
const CardText = require('./CardText');

class CommandCallAssessor {
  static SETTING = 'core.agent.shellClassifier';

  static COMMAND_TOOLS = {
    run_command: {
      command: (p) => p && p.command,
      cwd: (p) => p && p.cwd,
      shell: (p) => ((p && p.shell && p.shell !== 'auto') ? p.shell : null),
    },
  };

  static isCommandTool(toolName) {
    return Object.prototype.hasOwnProperty.call(CommandCallAssessor.COMMAND_TOOLS, String(toolName || ''));
  }

  static isEnabled(db) {
    try {
      if (!db || typeof db.get !== 'function') return true;
      const value = db.get(CommandCallAssessor.SETTING, true);
      return !(value === false || value === 'false' || value === 0 || value === '0' || value === 'off');
    } catch (_) {
      return true;
    }
  }

  static assess(toolName, params, ctx = {}) {
    if (!CommandCallAssessor.isCommandTool(toolName) || ctx.enabled === false) return null;
    return new CommandCallAssessor()._execute(CommandCallAssessor.COMMAND_TOOLS[toolName], params, ctx);
  }

  _execute(spec, params, ctx) {
    this._setupSharedVariablesFromParameters(spec, params, ctx);
    if (!this._command) return null;
    if (!this._classify()) return this._classifierFailure();
    this._checkWriteBoundary();
    return this._createAssessment();
  }

  _setupSharedVariablesFromParameters(spec, params, ctx) {
    this._spec = spec;
    this._params = params;
    this._ctx = ctx;
    this._command = String(spec.command(params) || '').trim();
    this._dialect = ctx.dialect || spec.shell(params) || 'auto';
    this._outside = [];
    this._unverifiable = [];
  }

  _classify() {
    try {
      this._classification = ShellClassifier.classify(this._command, { dialect: this._dialect });
      return true;
    } catch (err) {
      this._error = err;
      return false;
    }
  }

  _classifierFailure() {
    return {
      verdict: 'ask',
      tier: 'normal',
      reasons: [`classifier error: ${this._error.message}`],
      outside: [],
      unverifiable: [],
      command: this._command,
      detail: CommandCallAssessor._runText(this._command),
    };
  }

  _checkWriteBoundary() {
    const root = this._ctx.projectRoot;
    if (!root || this._classification.tier === 'forbidden') return;
    try {
      const dialect = this._dialect === 'auto' ? undefined : this._dialect;
      const result = ShellWriteBoundary.check(this._command, this._workingDirectory(root), [root], { dialect, env: this._ctx.env });
      this._outside = result.outside;
      this._unverifiable = result.unverifiable;
    } catch (_) {}
  }

  _workingDirectory(root) {
    const relative = this._spec.cwd(this._params);
    const trimmed = relative ? String(relative).trim() : '';
    return trimmed && trimmed !== '.' ? path.resolve(root, String(relative)) : root;
  }

  _createAssessment() {
    const { tier, reasons } = this._classification;
    return {
      verdict: CommandCallAssessor._verdictFor(tier, this._outside),
      tier,
      reasons,
      outside: this._outside,
      unverifiable: this._unverifiable,
      command: this._command,
      detail: this._detail(),
    };
  }

  static _verdictFor(tier, outside) {
    if (tier === 'forbidden') return 'deny';
    if (tier === 'mass-destructive' || outside.length) return 'ask-always';
    if (tier === 'readonly') return 'skip';
    return 'ask';
  }

  _detail() {
    const parts = [CommandCallAssessor._runText(this._command)];
    const { tier, reasons } = this._classification;
    if (tier === 'mass-destructive' && reasons[0]) parts.push(reasons[0]);
    if (this._outside.length) parts.push(CommandCallAssessor._outsideText(this._outside));
    return parts.join('. ');
  }

  static _runText(command) {
    return `Run \`${CardText.clip(command, 120)}\``;
  }

  static _outsideText(outside) {
    const named = outside.slice(0, 3).map((p) => CardText.clip(p, 80)).join(', ');
    const more = outside.length > 3 ? ` and ${outside.length - 3} more` : '';
    return `Writes outside the project: ${named}${more}`;
  }
}

module.exports = CommandCallAssessor;
