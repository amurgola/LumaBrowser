const GgufTensorLayout = require('./GgufTensorLayout');

class GgufRoleTable {
  static ROLES = Object.freeze({
    MAIN: 'main', DRAFT: 'draft', MMPROJ: 'mmproj', EMBEDDING: 'embedding', RERANKER: 'reranker', MTP: 'mtp',
  });

  static PROJECTOR_ARCHES = new Set(['clip', 'mmproj']);

  static ENCODER_ARCHES = new Set([
    'bert', 'nomic-bert', 'nomic-bert-moe', 'jina-bert-v2', 'jina-bert-v3', 'xlm-roberta', 'roberta', 'roberta-bert',
    'modern-bert', 'neo-bert', 'distilbert', 'gte', 'bge', 'bge-m3', 'e5', 'eurobert', 'arctic-embed', 't5encoder',
  ]);

  static GENERAL_TYPE_ROLES = Object.freeze({
    mmproj: 'mmproj', projector: 'mmproj', 'clip-vision': 'mmproj',
    embedding: 'embedding', embeddings: 'embedding',
    reranker: 'reranker', rerank: 'reranker',
    draft: 'draft',
  });

  static POOLING = Object.freeze({ NONE: 0, MEAN: 1, CLS: 2, LAST: 3, RANK: 4 });

  static POOLING_ROLES = Object.freeze({ 1: 'embedding', 2: 'embedding', 3: 'embedding', 4: 'reranker' });

  static CLIP_KEY = /^clip\./;

  static headerRole(facts) {
    const arch = GgufRoleTable._lower(facts.architecture);
    const type = GgufRoleTable._lower(facts.generalType);
    const pooling = facts.poolingType === null || facts.poolingType === undefined ? null : Number(facts.poolingType);
    const decided = GgufRoleTable._projector(arch, type, facts.hasClipKeys)
      || GgufRoleTable._typed(type)
      || GgufRoleTable._pooled(pooling, arch)
      || GgufRoleTable._encoder(arch)
      || GgufRoleTable._detachedMtp(facts.tensorScan);
    if (decided) return decided;
    if (arch) return { role: GgufRoleTable.ROLES.MAIN, reason: `architecture ${arch} is a decoder` };
    return { role: null, reason: 'header names no architecture or type' };
  }

  static isKnownRole(role) {
    return Object.values(GgufRoleTable.ROLES).includes(role);
  }

  static _projector(arch, type, hasClipKeys) {
    if (GgufRoleTable.PROJECTOR_ARCHES.has(arch)) return { role: 'mmproj', reason: `architecture ${arch}` };
    if (GgufRoleTable.GENERAL_TYPE_ROLES[type] === 'mmproj') return { role: 'mmproj', reason: `general.type ${type}` };
    if (hasClipKeys) return { role: 'mmproj', reason: 'clip.* keys present' };
    return null;
  }

  static _typed(type) {
    const role = GgufRoleTable.GENERAL_TYPE_ROLES[type];
    return role ? { role, reason: `general.type ${type}` } : null;
  }

  static _pooled(pooling, arch) {
    if (pooling === null || !Number.isFinite(pooling)) return null;
    const role = GgufRoleTable.POOLING_ROLES[pooling];
    return role ? { role, reason: `${arch || 'model'} pooling_type ${pooling}` } : null;
  }

  static _encoder(arch) {
    return GgufRoleTable.ENCODER_ARCHES.has(arch) ? { role: 'embedding', reason: `encoder architecture ${arch}` } : null;
  }

  static _detachedMtp(tensorScan) {
    return GgufTensorLayout.isDetachedMtpHead(tensorScan)
      ? { role: 'mtp', reason: 'only nextn blocks in the tensor scan' }
      : null;
  }

  static _lower(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }
}

module.exports = GgufRoleTable;
