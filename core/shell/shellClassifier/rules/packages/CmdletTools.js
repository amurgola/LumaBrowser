const ToolFamily = require('./ToolFamily');
const VerbTable = require('./VerbTable');
const RiskEffect = require('./RiskEffect');

const { PUBLISH, TEARDOWN, DATA_LOSS } = RiskEffect;

class CmdletTools extends ToolFamily {
  static AZ_REMOVAL_KEY = 'remove-az*';
  static AZ_REMOVAL = /^remove-az[a-z]/;

  buildTable() {
    return new VerbTable([
      { tools: ['publish-module', 'publish-script', 'publish-psresource'], rows: [{ effect: PUBLISH, preview: true }] },
      { tools: ['remove-azresourcegroup'], rows: [{ effect: TEARDOWN, scope: 'everything in the resource group', preview: true }] },
      { tools: [CmdletTools.AZ_REMOVAL_KEY], rows: [{ effect: TEARDOWN, preview: true }] },
      { tools: ['remove-s3bucket'], rows: [
        { when: (a) => a.hasOption('deletebucketcontent'), effect: DATA_LOSS, scope: 'with its contents', preview: true },
        { effect: TEARDOWN, preview: true },
      ] },
      { tools: ['remove-s3object'], rows: [{ effect: DATA_LOSS, preview: true }] },
      { tools: ['remove-ec2instance', 'remove-rdsdbinstance', 'remove-rdsdbcluster'], rows: [{ effect: TEARDOWN, preview: true }] },
    ]);
  }

  tableKey(tool) {
    if (this.table.has(tool)) return tool;
    return CmdletTools.AZ_REMOVAL.test(tool) ? CmdletTools.AZ_REMOVAL_KEY : tool;
  }
}

module.exports = CmdletTools;
