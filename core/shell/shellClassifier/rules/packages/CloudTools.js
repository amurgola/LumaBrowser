const ToolFamily = require('./ToolFamily');
const VerbTable = require('./VerbTable');
const RiskEffect = require('./RiskEffect');

const { DATA_LOSS, TEARDOWN } = RiskEffect;
const { oneOf } = VerbTable;

class CloudTools extends ToolFamily {
  buildTable() {
    return new VerbTable([
      { tools: ['aws'], rows: CloudTools._awsRows() },
      { tools: ['az'], rows: [
        { path: 'group delete', effect: TEARDOWN, scope: 'everything in the resource group' },
        { anyWord: oneOf('delete', 'purge'), effect: TEARDOWN },
      ] },
      { tools: ['gcloud'], rows: [
        { path: 'projects delete', effect: TEARDOWN, scope: 'the whole project' },
        { anyWord: oneOf('delete'), effect: TEARDOWN },
      ] },
      { tools: ['doctl'], rows: [{ anyWord: oneOf('delete', 'del', 'rm'), effect: TEARDOWN }] },
      ...CloudTools._hostingPlatforms(),
    ]);
  }

  static _awsRows() {
    return [
      { path: 's3 rm', when: (a) => a.hasOption('recursive'), effect: DATA_LOSS, scope: 'recursive', preview: true },
      { path: 's3 rm', effect: DATA_LOSS, preview: true },
      { path: 's3 rb', when: (a) => a.hasOption('force'), effect: DATA_LOSS, scope: 'forced, empties the bucket first' },
      { path: 's3 rb', effect: TEARDOWN },
      { path: 's3 sync', when: (a) => a.hasOption('delete'), effect: DATA_LOSS, scope: 'deletes destination files missing from the source', preview: true },
      { path: ['*', CloudTools._isAwsDeleteOperation], effect: TEARDOWN, preview: true },
    ];
  }

  static _isAwsDeleteOperation(operation) {
    return /^(delete|terminate|deregister|purge)-/.test(operation);
  }

  static _hostingPlatforms() {
    return [
      { tools: ['fly', 'flyctl'], rows: [{ anyWord: oneOf('destroy', 'delete', 'remove', 'rm'), effect: TEARDOWN }] },
      { tools: ['heroku'], rows: [
        { anyWord: oneOf('pg:reset'), effect: DATA_LOSS },
        { anyWord: (word) => /(^|:)(destroy|delete|remove)$/.test(word), effect: TEARDOWN },
      ] },
      { tools: ['vercel'], rows: [{ anyWord: oneOf('remove', 'rm'), effect: TEARDOWN }] },
      { tools: ['netlify'], rows: [{ anyWord: (word) => /(^|:)delete$/.test(word), effect: TEARDOWN }] },
      { tools: ['railway'], rows: [{ anyWord: oneOf('down', 'delete'), effect: TEARDOWN }] },
      { tools: ['wrangler'], rows: [{ anyWord: oneOf('delete'), effect: TEARDOWN }] },
    ];
  }
}

module.exports = CloudTools;
