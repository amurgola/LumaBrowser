const path = require('path');
const GgufFileName = require('../models/GgufFileName');

class GgufModelGrouper {
  static SHARD = /^(.+)-(\d{5})-of-(\d{5})\.gguf$/i;

  static MMPROJ = /^mmproj[-_]/i;

  static DRAFTER = /\bdflash\b/i;

  static group(files, rootDir) {
    const models = [];
    for (const [dir, bucket] of GgufModelGrouper._bucketByDir(files)) {
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

  static _bucketByDir(files) {
    const byDir = new Map();
    for (const file of files) {
      let bucket = byDir.get(file.directory);
      if (!bucket) {
        bucket = { weightGroups: new Map(), mmprojFiles: [], drafterFiles: [], mtpFiles: [] };
        byDir.set(file.directory, bucket);
      }
      GgufModelGrouper._sort(bucket, file);
    }
    return byDir;
  }

  static _sort(bucket, file) {
    if (GgufModelGrouper.MMPROJ.test(file.name)) return bucket.mmprojFiles.push(file);
    if (GgufModelGrouper.DRAFTER.test(file.name)) return bucket.drafterFiles.push(file);
    if (GgufFileName.isMtpHead(file.name)) return bucket.mtpFiles.push(file);
    const shard = file.name.match(GgufModelGrouper.SHARD);
    if (!shard) {
      const stem = GgufModelGrouper.stemOf(file.name);
      bucket.weightGroups.set(stem, GgufModelGrouper._singleFileGroup(file));
      return undefined;
    }
    const [, stem, index, total] = shard;
    let group = bucket.weightGroups.get(stem);
    if (!group) {
      group = { stem, expectedShards: parseInt(total, 10), files: [] };
      bucket.weightGroups.set(stem, group);
    }
    group.files.push({ ...file, shardIndex: parseInt(index, 10), shardTotal: parseInt(total, 10) });
    return undefined;
  }

  static _singleFileGroup(file) {
    return {
      stem: GgufModelGrouper.stemOf(file.name),
      expectedShards: 1,
      files: [{ ...file, shardIndex: null, shardTotal: null }],
    };
  }

  static _modelsOfDir(dir, relativeDirectory, bucket) {
    const weightGroups = [...bucket.weightGroups.values()];
    let drafters = bucket.drafterFiles;
    if (weightGroups.length === 0 && drafters.length > 0) {
      for (const file of drafters) weightGroups.push(GgufModelGrouper._singleFileGroup(file));
      drafters = [];
    }
    const { mmprojFiles, mtpFiles } = bucket;
    if (weightGroups.length === 0 && (mmprojFiles.length > 0 || mtpFiles.length > 0)) {
      return [...mmprojFiles, ...mtpFiles].map((file) => GgufModelGrouper._companionOnly(dir, relativeDirectory, file));
    }
    const companions = { mmprojs: mmprojFiles, drafters, mtpHeads: mtpFiles };
    return weightGroups.map((group) => GgufModelGrouper._weightsModel(dir, relativeDirectory, group, companions));
  }

  static _companionOnly(dir, relativeDirectory, file) {
    return {
      kind: GgufFileName.isMtpHead(file.name) ? 'mtp-only' : 'mmproj-only',
      name: GgufModelGrouper.stemOf(file.name),
      directory: dir,
      relativeDirectory,
      weights: [{ path: file.path, name: file.name, sizeBytes: file.sizeBytes, shardIndex: null, shardTotal: null }],
      weightsCount: 1,
      weightsExpectedShards: 1,
      weightsTotalBytes: file.sizeBytes,
      mmproj: [],
      mmprojTotalBytes: 0,
      mtp: [],
      mtpTotalBytes: 0,
      totalBytes: file.sizeBytes,
      sidecars: [],
    };
  }

  static _weightsModel(dir, relativeDirectory, group, { mmprojs, drafters, mtpHeads }) {
    group.files.sort((a, b) => (a.shardIndex || 0) - (b.shardIndex || 0));
    const weightsTotalBytes = GgufModelGrouper._sumBytes(group.files);
    const mmprojTotalBytes = GgufModelGrouper._sumBytes(mmprojs);
    const drafterTotalBytes = GgufModelGrouper._sumBytes(drafters);
    const mtpTotalBytes = GgufModelGrouper._sumBytes(mtpHeads);
    return {
      kind: 'weights',
      name: group.stem,
      directory: dir,
      relativeDirectory,
      weights: group.files.map((f) => ({
        path: f.path, name: f.name, sizeBytes: f.sizeBytes, shardIndex: f.shardIndex, shardTotal: f.shardTotal,
      })),
      weightsCount: group.files.length,
      weightsExpectedShards: group.expectedShards,
      weightsTotalBytes,
      mmproj: GgufModelGrouper._fileRefs(mmprojs),
      mmprojTotalBytes,
      drafter: GgufModelGrouper._fileRefs(drafters),
      drafterTotalBytes,
      mtp: GgufModelGrouper._fileRefs(mtpHeads),
      mtpTotalBytes,
      totalBytes: weightsTotalBytes + mmprojTotalBytes + drafterTotalBytes + mtpTotalBytes,
      sidecars: [],
    };
  }

  static _fileRefs(files) {
    return files.map((f) => ({ path: f.path, name: f.name, sizeBytes: f.sizeBytes }));
  }

  static _sumBytes(files) {
    return files.reduce((sum, f) => sum + f.sizeBytes, 0);
  }
}

module.exports = GgufModelGrouper;
