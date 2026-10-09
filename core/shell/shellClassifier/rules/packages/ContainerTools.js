const ToolFamily = require('./ToolFamily');
const VerbTable = require('./VerbTable');
const RiskEffect = require('./RiskEffect');

const { DATA_LOSS, BULK_CLEANUP, DISRUPTION, UNCONFIRMED_REMOVAL, HOST_EXPOSURE } = RiskEffect;

class ContainerTools extends ToolFamily {
  static ENGINES = Object.freeze(['docker', 'podman', 'nerdctl']);
  static COMPOSE_FRONT_ENDS = Object.freeze(['docker-compose', 'podman-compose']);

  static ROOT_SOURCE = /^(\/|[a-z]:[\\/]?)$/i;

  buildTable() {
    return new VerbTable([
      { tools: ContainerTools.ENGINES, rows: [...ContainerTools._engineRows(), ...ContainerTools._prefixed('compose', ContainerTools._composeRows())] },
      { tools: ContainerTools.COMPOSE_FRONT_ENDS, rows: ContainerTools._composeRows() },
    ]);
  }

  static _engineRows() {
    const forced = ContainerTools._forced;
    return [
      { path: 'system prune', when: (a) => a.hasOption('volumes'), effect: DATA_LOSS, scope: 'including volumes' },
      { path: 'system prune', effect: BULK_CLEANUP },
      { path: 'system reset', effect: DATA_LOSS },
      { path: 'volume prune|rm', effect: DATA_LOSS },
      { path: 'image|container|network|builder|buildx prune', effect: BULK_CLEANUP },
      { path: 'rm', when: forced, effect: DISRUPTION, scope: 'forced, stops running containers' },
      { path: 'container rm', when: forced, effect: DISRUPTION, scope: 'forced, stops running containers' },
      { path: 'rmi', when: forced, effect: UNCONFIRMED_REMOVAL, scope: 'forced, even images in use' },
      { path: 'image rm', when: forced, effect: UNCONFIRMED_REMOVAL, scope: 'forced, even images in use' },
      { path: 'run|create', when: (a) => a.hasOption('privileged'), effect: HOST_EXPOSURE, scope: 'privileged' },
      { path: 'run|create', when: ContainerTools._mountsHostRoot, effect: HOST_EXPOSURE, scope: 'mounts the host root' },
    ];
  }

  static _composeRows() {
    const withVolumes = (a) => a.hasOption('volumes') || a.hasShortFlag('v');
    return [
      { path: 'down', when: withVolumes, effect: DATA_LOSS, scope: 'with volumes' },
      { path: 'down', when: (a) => a.hasOption('rmi'), effect: BULK_CLEANUP, scope: 'with images' },
      { path: 'rm', when: withVolumes, effect: DATA_LOSS, scope: 'with volumes' },
      { path: 'rm', when: ContainerTools._forced, effect: UNCONFIRMED_REMOVAL },
    ];
  }

  static _prefixed(word, rows) {
    return rows.map((row) => ({ ...row, path: `${word} ${row.path}` }));
  }

  static _forced(toolArgs) {
    return toolArgs.hasOption('force') || toolArgs.hasShortFlag('f');
  }

  static _mountsHostRoot(toolArgs) {
    const binds = toolArgs.valuesOf('v', 'volume').map((spec) => ContainerTools._bindSource(spec));
    const mounts = toolArgs.valuesOf('mount').map((spec) => ContainerTools._mountSource(spec));
    return [...binds, ...mounts].some((source) => ContainerTools.ROOT_SOURCE.test(source));
  }

  static _bindSource(spec) {
    const drive = /^[a-z]:/i.test(spec) ? 2 : 0;
    const colon = spec.indexOf(':', drive);
    return colon === -1 ? '' : spec.slice(0, colon);
  }

  static _mountSource(spec) {
    const field = spec.split(',').find((part) => /^(source|src)=/i.test(part));
    return field ? field.slice(field.indexOf('=') + 1) : '';
  }
}

module.exports = ContainerTools;
