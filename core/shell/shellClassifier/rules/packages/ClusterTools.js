const ToolFamily = require('./ToolFamily');
const VerbTable = require('./VerbTable');
const RiskEffect = require('./RiskEffect');

const { TEARDOWN, DISRUPTION } = RiskEffect;

class ClusterTools extends ToolFamily {
  static SWEEPING_KINDS = Object.freeze([
    'namespace', 'namespaces', 'ns', 'persistentvolume', 'persistentvolumes', 'pv',
    'customresourcedefinition', 'customresourcedefinitions', 'crd', 'crds',
  ]);

  buildTable() {
    return new VerbTable([
      { tools: ['kubectl', 'oc'], rows: ClusterTools._kubectlRows() },
      { tools: ['helm'], rows: ClusterTools._helmRows() },
    ]);
  }

  static _kubectlRows() {
    return [
      { path: 'delete', when: ClusterTools._deletesSweepingly, effect: TEARDOWN, scope: 'whole namespaces, volumes or every resource', preview: true },
      { path: 'delete', effect: TEARDOWN, preview: true },
      { path: 'drain', effect: DISRUPTION, scope: 'evicts every pod on the node', preview: true },
      { path: 'cordon', effect: DISRUPTION, scope: 'no new pods on the node', preview: true },
      { path: 'taint', effect: DISRUPTION, preview: true },
      { path: 'scale', when: (a) => a.valuesOf('replicas').includes('0'), effect: DISRUPTION, scope: 'to zero replicas', preview: true },
      { path: 'rollout undo', effect: DISRUPTION, preview: true },
      { path: 'apply', when: (a) => a.hasOption('prune'), effect: TEARDOWN, scope: 'prunes resources missing from the manifests', preview: true },
      { path: 'replace', when: (a) => a.hasOption('force'), effect: DISRUPTION, scope: 'forced, deletes and recreates', preview: true },
    ];
  }

  static _helmRows() {
    return [
      { path: 'uninstall|delete|del|un', effect: TEARDOWN, preview: true },
      { path: 'rollback', effect: DISRUPTION, preview: true },
      { path: 'upgrade', when: (a) => a.hasOption('force'), effect: DISRUPTION, scope: 'forced, replaces resources', preview: true },
    ];
  }

  static _deletesSweepingly(toolArgs) {
    if (toolArgs.hasOption('all', 'all-namespaces') || toolArgs.hasShortFlag('A')) return true;
    return toolArgs.words.some((word) => ClusterTools._kindsIn(word).some((kind) => ClusterTools.SWEEPING_KINDS.includes(kind)));
  }

  static _kindsIn(word) {
    return word.split(',').map((part) => part.split('/')[0]);
  }
}

module.exports = ClusterTools;
