const ToolFamily = require('./ToolFamily');
const VerbTable = require('./VerbTable');
const RiskEffect = require('./RiskEffect');

const { PUBLISH, WITHDRAW, REGISTRY_ACCESS, CACHE_WIPE, UNCONFIRMED_REMOVAL } = RiskEffect;

class RegistryTools extends ToolFamily {
  buildTable() {
    return new VerbTable([
      ...RegistryTools._javascript(),
      ...RegistryTools._python(),
      ...RegistryTools._compiledLanguages(),
      ...RegistryTools._otherLanguages(),
    ]);
  }

  static _javascript() {
    return [
      { tools: ['npm', 'pnpm'], rows: [
        { path: 'publish', effect: PUBLISH, preview: true },
        { path: 'dist-tag add|rm', effect: PUBLISH },
        { path: 'unpublish', effect: WITHDRAW, preview: true },
        { path: 'deprecate', effect: WITHDRAW },
        { path: 'owner|author add|rm', effect: REGISTRY_ACCESS },
        { path: 'access grant|revoke|set|public|restricted|2fa-required|2fa-not-required', effect: REGISTRY_ACCESS },
        { path: 'team create|destroy|add|rm', effect: REGISTRY_ACCESS },
        { path: 'org set|rm', effect: REGISTRY_ACCESS },
        { path: 'token create|revoke', effect: REGISTRY_ACCESS },
        { path: 'hook add|rm|update', effect: REGISTRY_ACCESS },
        { path: 'login|adduser|add-user|logout', effect: REGISTRY_ACCESS },
        { path: 'cache clean', effect: CACHE_WIPE },
      ] },
      { tools: ['yarn'], rows: [
        { path: 'publish', effect: PUBLISH },
        { path: 'npm publish', effect: PUBLISH },
        { path: 'tag add|remove', effect: PUBLISH },
        { path: 'npm tag add|remove', effect: PUBLISH },
        { path: 'owner add|remove', effect: REGISTRY_ACCESS },
        { path: 'login|logout', effect: REGISTRY_ACCESS },
        { path: 'npm login|logout', effect: REGISTRY_ACCESS },
        { path: 'cache clean', effect: CACHE_WIPE },
      ] },
      { tools: ['bun'], rows: [
        { path: 'publish', effect: PUBLISH, preview: true },
        { path: 'pm cache rm', effect: CACHE_WIPE },
      ] },
      { tools: ['deno'], rows: [{ path: 'publish', effect: PUBLISH, preview: true }] },
    ];
  }

  static _python() {
    return [
      { tools: ['twine'], rows: [{ path: 'upload', effect: PUBLISH }] },
      { tools: ['poetry'], rows: [{ path: 'publish', effect: PUBLISH, preview: true }] },
      { tools: ['uv'], rows: [
        { path: 'publish', effect: PUBLISH, preview: true },
        { path: 'cache clean', effect: CACHE_WIPE },
      ] },
      { tools: ['pdm', 'hatch', 'flit'], rows: [{ path: 'publish', effect: PUBLISH }] },
      { tools: ['pip', 'pip3'], rows: [
        { path: 'uninstall', when: (a) => a.hasOption('y', 'yes'), effect: UNCONFIRMED_REMOVAL },
        { path: 'cache purge', effect: CACHE_WIPE },
      ] },
    ];
  }

  static _compiledLanguages() {
    return [
      { tools: ['cargo'], rows: [
        { path: 'publish', effect: PUBLISH, preview: true },
        { path: 'yank', effect: WITHDRAW },
        { path: 'owner', when: RegistryTools._editsOwnerList, effect: REGISTRY_ACCESS },
        { path: 'login|logout', effect: REGISTRY_ACCESS },
      ] },
      { tools: ['mvn', 'mvnw'], rows: [{ anyWord: RegistryTools._isMavenDeployGoal, effect: PUBLISH }] },
      { tools: ['gradle', 'gradlew'], rows: [{ anyWord: RegistryTools._isRemotePublishTask, effect: PUBLISH }] },
      { tools: ['dotnet'], rows: [
        { path: 'nuget push', effect: PUBLISH },
        { path: 'nuget delete', effect: WITHDRAW },
        { path: 'nuget locals', when: (a) => a.hasOption('clear', 'c'), effect: CACHE_WIPE },
      ] },
      { tools: ['nuget'], rows: [
        { path: 'push', effect: PUBLISH },
        { path: 'delete', effect: WITHDRAW },
        { path: 'locals', when: (a) => a.hasOption('clear'), effect: CACHE_WIPE },
      ] },
      { tools: ['swift'], rows: [{ path: 'package-registry publish', effect: PUBLISH, preview: true }] },
      { tools: ['go'], rows: [{ path: 'clean', when: (a) => a.hasOption('modcache'), effect: CACHE_WIPE, scope: 'module cache' }] },
    ];
  }

  static _otherLanguages() {
    return [
      { tools: ['gem'], rows: [
        { path: 'push', effect: PUBLISH },
        { path: 'yank', effect: WITHDRAW },
        { path: 'owner', when: RegistryTools._editsOwnerList, effect: REGISTRY_ACCESS },
        { path: 'signin|signout', effect: REGISTRY_ACCESS },
      ] },
      { tools: ['mix'], rows: [
        { path: 'hex.publish', effect: PUBLISH, preview: true },
        { path: 'hex.retire', effect: WITHDRAW },
        { path: 'hex.owner add|remove|transfer', effect: REGISTRY_ACCESS },
      ] },
      { tools: ['composer'], rows: [{ path: 'clear-cache|clearcache|cc', effect: CACHE_WIPE }] },
    ];
  }

  static _editsOwnerList(toolArgs) {
    return toolArgs.hasOption('add', 'remove', 'a', 'r');
  }

  static _isMavenDeployGoal(goal) {
    return goal === 'deploy' || goal.endsWith(':deploy') || goal === 'release:perform';
  }

  static _isRemotePublishTask(task) {
    const name = task.slice(task.lastIndexOf(':') + 1);
    return name.startsWith('publish') && !name.endsWith('tomavenlocal');
  }
}

module.exports = RegistryTools;
