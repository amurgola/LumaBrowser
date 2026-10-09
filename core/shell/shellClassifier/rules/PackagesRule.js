const ShellRule = require('../ShellRule');
const ToolArgs = require('./packages/ToolArgs');
const PreviewFlags = require('./packages/PreviewFlags');
const RiskEffect = require('./packages/RiskEffect');
const RegistryTools = require('./packages/RegistryTools');
const ContainerTools = require('./packages/ContainerTools');
const ClusterTools = require('./packages/ClusterTools');
const CloudTools = require('./packages/CloudTools');
const InfrastructureTools = require('./packages/InfrastructureTools');
const DatabaseShellTools = require('./packages/DatabaseShellTools');
const SchemaTools = require('./packages/SchemaTools');
const CmdletTools = require('./packages/CmdletTools');

class PackagesRule extends ShellRule {
  static FAMILIES = Object.freeze([
    new RegistryTools(), new ContainerTools(), new ClusterTools(), new CloudTools(),
    new InfrastructureTools(), new DatabaseShellTools(), new SchemaTools(), new CmdletTools(),
  ]);

  assess({ name, args }) {
    return ShellRule.massDestructive(PackagesRule.reasonFor(name, args));
  }

  static reasonFor(name, args) {
    const finding = PackagesRule.findingFor(name, args);
    return finding ? RiskEffect.reasonFor(finding) : null;
  }

  static findingFor(name, args) {
    const tool = PackagesRule._toolName(name);
    const family = PackagesRule.FAMILIES.find((candidate) => candidate.handles(tool));
    if (!family) return null;
    const toolArgs = new ToolArgs(args);
    const finding = family.findRisk(tool, toolArgs);
    return finding && !PackagesRule._isRehearsed(finding, toolArgs) ? finding : null;
  }

  static _toolName(name) {
    return String(name || '').toLowerCase().replace(/\.(exe|cmd|bat|ps1)$/, '');
  }

  static _isRehearsed(finding, toolArgs) {
    return finding.preview && PreviewFlags.rehearses(toolArgs);
  }
}

module.exports = PackagesRule;
