const ToolFamily = require('./ToolFamily');
const VerbTable = require('./VerbTable');
const RiskEffect = require('./RiskEffect');

const { TEARDOWN, UNREVIEWED_CHANGE, STATE_REWRITE } = RiskEffect;

class InfrastructureTools extends ToolFamily {
  static TERRAFORM_STATE_READERS = Object.freeze(['list', 'show', 'pull', 'identities']);

  buildTable() {
    return new VerbTable([
      { tools: ['terraform', 'tofu', 'terragrunt'], rows: InfrastructureTools._terraformRows() },
      { tools: ['terragrunt'], rows: [{ anyWord: VerbTable.oneOf('destroy'), effect: TEARDOWN, scope: 'every module' }] },
      { tools: ['pulumi'], rows: InfrastructureTools._pulumiRows() },
      { tools: ['cdk', 'cdktf', 'sst'], rows: InfrastructureTools._cdkRows() },
      { tools: ['serverless', 'sls'], rows: [{ path: 'remove', effect: TEARDOWN }] },
      { tools: ['vagrant'], rows: [{ path: 'destroy', effect: TEARDOWN }] },
    ]);
  }

  static _terraformRows() {
    return [
      { path: 'destroy', effect: TEARDOWN },
      { path: 'apply', when: (a) => a.hasOption('destroy'), effect: TEARDOWN },
      { path: 'apply', when: (a) => a.hasOption('auto-approve'), effect: UNREVIEWED_CHANGE },
      { path: ['state', InfrastructureTools._writesTerraformState], effect: STATE_REWRITE },
      { path: 'taint|untaint|import|force-unlock', effect: STATE_REWRITE },
      { path: 'workspace delete', effect: STATE_REWRITE },
    ];
  }

  static _pulumiRows() {
    return [
      { path: 'destroy', effect: TEARDOWN, preview: true },
      { path: 'stack rm', effect: TEARDOWN },
      { path: 'up|update', when: (a) => a.hasOption('yes', 'y', 'skip-preview'), effect: UNREVIEWED_CHANGE },
      { path: 'state *', effect: STATE_REWRITE },
    ];
  }

  static _cdkRows() {
    return [
      { path: 'destroy|remove', effect: TEARDOWN },
      { path: 'deploy', when: InfrastructureTools._skipsApproval, effect: UNREVIEWED_CHANGE },
    ];
  }

  static _writesTerraformState(subcommand) {
    return !InfrastructureTools.TERRAFORM_STATE_READERS.includes(subcommand);
  }

  static _skipsApproval(toolArgs) {
    return toolArgs.valuesOf('require-approval').includes('never') || toolArgs.hasOption('auto-approve');
  }
}

module.exports = InfrastructureTools;
