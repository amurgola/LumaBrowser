class RiskEffect {
  static PUBLISH = 'publish';
  static WITHDRAW = 'withdraw';
  static REGISTRY_ACCESS = 'registry-access';
  static TEARDOWN = 'teardown';
  static UNREVIEWED_CHANGE = 'unreviewed-change';
  static STATE_REWRITE = 'state-rewrite';
  static DISRUPTION = 'disruption';
  static DATA_LOSS = 'data-loss';
  static ACCOUNT_REMOVAL = 'account-removal';
  static SERVER_CONFIG = 'server-config';
  static HOST_EXPOSURE = 'host-exposure';
  static BULK_CLEANUP = 'bulk-cleanup';
  static UNCONFIRMED_REMOVAL = 'unconfirmed-removal';
  static CACHE_WIPE = 'cache-wipe';

  static CONSEQUENCES = Object.freeze({
    publish: 'changes what a shared package registry serves to everyone who installs from it; a published version usually cannot be taken back.',
    withdraw: 'pulls or deprecates a published package version that other projects may depend on.',
    'registry-access': 'changes who may publish or own a package, or the registry credentials stored on this machine.',
    teardown: 'tears down live infrastructure, a deployment or a cloud resource.',
    'unreviewed-change': 'changes live infrastructure without showing a plan for review first.',
    'state-rewrite': 'edits infrastructure state by hand, so the tool can lose track of real resources.',
    disruption: 'takes running workloads offline or changes what is serving traffic.',
    'data-loss': 'deletes or overwrites stored data that cannot be brought back from the command line.',
    'account-removal': 'deletes a database login or role.',
    'server-config': 'changes the configuration of a running server.',
    'host-exposure': 'gives a container access to the host machine.',
    'bulk-cleanup': 'deletes every unused item of that kind in one go.',
    'unconfirmed-removal': 'removes things without asking for confirmation first.',
    'cache-wipe': 'empties a shared download cache, so every project on this machine downloads its dependencies again.',
  });

  static isKnown(effect) {
    return Object.prototype.hasOwnProperty.call(RiskEffect.CONSEQUENCES, effect);
  }

  static reasonFor(finding) {
    if (!finding || !RiskEffect.isKnown(finding.effect)) return null;
    return `${RiskEffect._what(finding)} ${RiskEffect.CONSEQUENCES[finding.effect]}`;
  }

  static _what({ subject, scope }) {
    return scope ? `${subject} (${scope})` : subject;
  }
}

module.exports = RiskEffect;
