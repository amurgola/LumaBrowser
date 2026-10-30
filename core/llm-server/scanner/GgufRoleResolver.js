const GgufFileName = require('../models/GgufFileName');
const BoundedParallel = require('./BoundedParallel');

class GgufRoleResolver {
  static CONCURRENCY = 4;

  static async resolve(files, headerCache, concurrency = GgufRoleResolver.CONCURRENCY) {
    const targets = (files || []).filter((file) => GgufRoleResolver.isTarget(file));
    const infos = await BoundedParallel.map(targets, concurrency, (file) => GgufRoleResolver.resolveOne(file, headerCache));
    const roles = new Map();
    targets.forEach((file, i) => roles.set(file.path, infos[i]));
    return roles;
  }

  static isTarget(file) {
    const { shard } = GgufFileName.split(file.name || '');
    return !shard || shard.i === 1;
  }

  static async resolveOne(file, headerCache) {
    const header = await GgufRoleResolver._read(file, headerCache);
    if (header && header.ok && header.role) return GgufRoleResolver._fromHeader(file, header);
    return GgufRoleResolver.fromFilename(file, header);
  }

  static async _read(file, headerCache) {
    try {
      return await headerCache.get(file.path, file.sizeBytes, file.modifiedAt);
    } catch (_) {
      return null;
    }
  }

  static _fromHeader(file, header) {
    const nameHint = GgufFileName.roleHint(file.name);
    if (header.role === 'main' && !header.tensorScan && nameHint === 'mtp') {
      return {
        role: 'mtp', roleSource: 'filename', nameHint, header,
        roleReason: 'header has no tensor scan; name marks a detached MTP head',
      };
    }
    return { role: header.role, roleSource: 'header', roleReason: header.roleReason, nameHint, header };
  }

  static fromFilename(file, header = null) {
    const nameHint = GgufFileName.roleHint(file.name);
    const usable = header && header.ok ? header : null;
    if (usable && !nameHint) {
      return {
        role: 'diffusion', roleSource: 'header', nameHint, header: usable,
        roleReason: 'header names no architecture or type: not a llama.cpp model (an image or video GGUF)',
      };
    }
    const why = usable ? 'header undecided' : 'header unavailable';
    return {
      role: nameHint || 'main',
      roleSource: 'filename',
      roleReason: `${why}; name ${nameHint ? `suggests ${nameHint}` : 'carries no role token'}`,
      nameHint,
      header: usable,
    };
  }
}

module.exports = GgufRoleResolver;
