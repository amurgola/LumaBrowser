const path = require('path');
const GgufFileName = require('../models/GgufFileName');
const GgufCompanionPairer = require('./GgufCompanionPairer');

class GgufModelGrouper {
  static SHARD = /^(.+)-(\d{5})-of-(\d{5})\.gguf$/i;

  static COMPANION_KIND = Object.freeze({ mmproj: 'mmproj', draft: 'drafter', mtp: 'mtp' });

  static COMPANION_ONLY_KIND = Object.freeze({ mmproj: 'mmproj-only', mtp: 'mtp-only' });

  static group(files, rootDir, roles = new Map()) {
    const models = [];
    for (const [dir, bucket] of GgufModelGrouper._bucketByDir(files, roles)) {
      const relativeDirectory = GgufModelGrouper.relativeDirectory(rootDir, dir);
      for (const model of GgufModelGrouper._modelsOfDir(dir, relativeDirectory, bucket)) models.push(model);
    }
    return models;
  }

  static relativeDirectory(rootDir, dir) {
    const rel = path.relative(rootDir, dir);
    return rel === '' ? '.' : rel;
  }

  static stemOf(name) {
    return name.replace(/\.gguf$/i, '');
  }

  static roleOf(file, roles) {
    const info = roles && roles.get(file.path);
    if (info) return info;
    const nameHint = GgufFileName.roleHint(file.name);
    return { role: nameHint || 'main', roleSource: 'filename', roleReason: 'header not read; file name', nameHint, header: null };
  }

  static _bucketByDir(files, roles) {
    const byDir = new Map();
    for (const file of files) {
      let bucket = byDir.get(file.directory);
      if (!bucket) {
        bucket = { weightGroups: new Map(), companions: [] };
        byDir.set(file.directory, bucket);
      }
      GgufModelGrouper._sort(bucket, file, GgufModelGrouper.roleOf(file, roles));
    }
    for (const bucket of byDir.values()) GgufModelGrouper._demoteSmallSiblings(bucket);
    return byDir;
  }

  static _sort(bucket, file, info) {
    const shard = file.name.match(GgufModelGrouper.SHARD);
    if (shard) return GgufModelGrouper._addShard(bucket, file, shard, info);
    const kind = GgufModelGrouper.COMPANION_KIND[info.role];
    if (kind) return bucket.companions.push(GgufModelGrouper._companion(kind, file, info));
    bucket.weightGroups.set(GgufModelGrouper.stemOf(file.name), GgufModelGrouper._singleFileGroup(file, info));
    return undefined;
  }

  static _addShard(bucket, file, [, stem, index, total], info) {
    let group = bucket.weightGroups.get(stem);
    if (!group) {
      group = GgufModelGrouper._newGroup(stem, parseInt(total, 10));
      bucket.weightGroups.set(stem, group);
    }
    group.files.push({ ...file, shardIndex: parseInt(index, 10), shardTotal: parseInt(total, 10) });
    if (parseInt(index, 10) === 1) GgufModelGrouper._setRole(group, info);
  }

  static _newGroup(stem, expectedShards) {
    return {
      stem, expectedShards, files: [],
      role: 'main', roleSource: 'filename', roleReason: 'shard group', nameHint: null, header: null,
    };
  }

  static _singleFileGroup(file, info) {
    const group = GgufModelGrouper._newGroup(GgufModelGrouper.stemOf(file.name), 1);
    group.files.push({ ...file, shardIndex: null, shardTotal: null });
    GgufModelGrouper._setRole(group, info);
    return group;
  }

  static _setRole(group, info) {
    group.role = GgufModelGrouper.COMPANION_KIND[info.role] ? 'main' : info.role;
    group.roleSource = info.roleSource;
    group.roleReason = info.roleReason;
    group.nameHint = info.nameHint || null;
    group.header = info.header || null;
  }

  static _companion(kind, file, info) {
    const header = info.header || null;
    const hinted = kind === 'drafter' && (info.nameHint === 'draft' || !!(header && header.role === 'draft'));
    return { kind, file, info, hinted };
  }

  static _demoteSmallSiblings(bucket) {
    const groups = [...bucket.weightGroups.values()].filter((g) => g.role === 'main');
    const described = groups.map((g) => GgufModelGrouper._describeGroup(g));
    for (const small of described) {
      if (small.group.files.length !== 1) continue;
      const big = described.find((other) => GgufCompanionPairer.isDraftOf(small, other, small.group.nameHint === 'draft'));
      if (!big) continue;
      bucket.weightGroups.delete(small.group.stem);
      const percent = Math.round(GgufCompanionPairer.sizeRatio(small, big) * 100);
      const info = {
        role: 'draft', roleSource: 'header', nameHint: small.group.nameHint, header: small.group.header,
        roleReason: `${small.architecture} decoder at ${percent}% of ${big.group.stem}`,
      };
      bucket.companions.push({ kind: 'drafter', file: small.group.files[0], info, hinted: small.group.nameHint === 'draft' });
    }
  }

  static _describeGroup(group) {
    const header = group.header;
    const single = group.files.length === 1;
    const countKnown = header && (header.parameterCountSource === 'header' || single);
    return {
      group,
      role: group.role,
      keys: GgufCompanionPairer.keysOf({
        fileName: group.stem, headerName: header && header.name, headerBaseName: header && header.baseName,
      }),
      architecture: (header && header.architecture) || null,
      parameterCount: countKnown ? header.parameterCount : null,
      sizeBytes: GgufModelGrouper._sumBytes(group.files),
    };
  }

  static _describeCompanion(companion) {
    const header = companion.info.header;
    return {
      kind: companion.kind,
      keys: GgufCompanionPairer.keysOf({
        fileName: companion.file.name, headerName: header && header.name, headerBaseName: header && header.baseName,
      }),
      architecture: (header && header.architecture) || null,
      parameterCount: (header && header.parameterCount) || null,
      sizeBytes: companion.file.sizeBytes,
      hinted: companion.hinted,
    };
  }

  static _modelsOfDir(dir, relativeDirectory, bucket) {
    const groups = [...bucket.weightGroups.values()];
    const described = groups.map((g) => GgufModelGrouper._describeGroup(g));
    const models = new Map(groups.map((g) => [g, GgufModelGrouper._weightsModel(dir, relativeDirectory, g)]));
    const extra = [];
    for (const companion of bucket.companions) {
      const pairing = GgufCompanionPairer.pair(GgufModelGrouper._describeCompanion(companion), described);
      if (pairing.status === 'paired') {
        for (const d of pairing.groups) GgufModelGrouper._attach(models.get(d.group), companion);
        continue;
      }
      if (pairing.status === 'ambiguous') GgufModelGrouper._recordUnpaired(models, pairing, companion);
      extra.push(GgufModelGrouper._loneCompanion(dir, relativeDirectory, companion, pairing));
    }
    const out = [...models.values(), ...extra];
    out.forEach((model) => GgufModelGrouper._finalizeTotals(model));
    return out;
  }

  static _attach(model, companion) {
    model[companion.kind].push(GgufModelGrouper._fileRef(companion.file));
  }

  static _recordUnpaired(models, pairing, companion) {
    for (const d of pairing.candidates) {
      models.get(d.group).unpairedCompanions.push({
        kind: companion.kind, ...GgufModelGrouper._fileRef(companion.file), reason: pairing.reason,
      });
    }
  }

  static _loneCompanion(dir, relativeDirectory, companion, pairing) {
    const verdict = {
      status: pairing.status, reason: pairing.reason, candidates: pairing.candidates.map((d) => d.group.stem),
    };
    if (companion.kind === 'drafter') {
      const group = GgufModelGrouper._singleFileGroup(companion.file, companion.info);
      group.role = 'draft';
      return { ...GgufModelGrouper._weightsModel(dir, relativeDirectory, group), pairing: verdict };
    }
    return GgufModelGrouper._companionOnly(dir, relativeDirectory, companion, verdict);
  }

  static _companionOnly(dir, relativeDirectory, companion, pairing) {
    const { file, info } = companion;
    return {
      kind: GgufModelGrouper.COMPANION_ONLY_KIND[info.role === 'mtp' ? 'mtp' : 'mmproj'],
      name: GgufModelGrouper.stemOf(file.name),
      directory: dir,
      relativeDirectory,
      role: info.role === 'mtp' ? 'mtp' : 'mmproj',
      roleSource: info.roleSource,
      roleReason: info.roleReason,
      weights: [{ ...GgufModelGrouper._fileRef(file), shardIndex: null, shardTotal: null }],
      weightsCount: 1,
      weightsExpectedShards: 1,
      weightsTotalBytes: file.sizeBytes,
      mmproj: [],
      mmprojTotalBytes: 0,
      mtp: [],
      mtpTotalBytes: 0,
      totalBytes: file.sizeBytes,
      sidecars: [],
      pairing,
    };
  }

  static _weightsModel(dir, relativeDirectory, group) {
    group.files.sort((a, b) => (a.shardIndex || 0) - (b.shardIndex || 0));
    return {
      kind: 'weights',
      name: group.stem,
      directory: dir,
      relativeDirectory,
      role: group.role,
      roleSource: group.roleSource,
      roleReason: group.roleReason,
      weights: group.files.map((f) => ({ ...GgufModelGrouper._fileRef(f), shardIndex: f.shardIndex, shardTotal: f.shardTotal })),
      weightsCount: group.files.length,
      weightsExpectedShards: group.expectedShards,
      weightsTotalBytes: GgufModelGrouper._sumBytes(group.files),
      mmproj: [],
      mmprojTotalBytes: 0,
      drafter: [],
      drafterTotalBytes: 0,
      mtp: [],
      mtpTotalBytes: 0,
      totalBytes: 0,
      sidecars: [],
      unpairedCompanions: [],
    };
  }

  static _finalizeTotals(model) {
    model.mmprojTotalBytes = GgufModelGrouper._sumBytes(model.mmproj);
    model.mtpTotalBytes = GgufModelGrouper._sumBytes(model.mtp);
    if (model.drafter) model.drafterTotalBytes = GgufModelGrouper._sumBytes(model.drafter);
    model.totalBytes = model.weightsTotalBytes + model.mmprojTotalBytes + model.mtpTotalBytes + (model.drafterTotalBytes || 0);
  }

  static _fileRef(f) {
    return { path: f.path, name: f.name, sizeBytes: f.sizeBytes, modifiedAt: f.modifiedAt || null };
  }

  static _sumBytes(files) {
    return files.reduce((sum, f) => sum + (Number(f.sizeBytes) || 0), 0);
  }
}

module.exports = GgufModelGrouper;
