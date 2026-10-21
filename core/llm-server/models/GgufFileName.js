class GgufFileName {
  static QUANT_TOKEN = '(?:IQ|Q)\\d+(?:_[0-9A-Z]+)*|BF16|F16|F32|F64|MXFP4|TQ\\d_\\d';

  static QUANT_AT_END = new RegExp(`[-_.](${GgufFileName.QUANT_TOKEN})$`, 'i');

  static SHARD_SUFFIX = /-(\d{5})-of-(\d{5})$/;

  static MTP_BASENAME = /^mtp[-_]/i;

  static MTP_DIR = /(?:^|\/)mtp\//i;

  static MMPROJ = /(?:^|[-_.])mmproj(?:[-_.]|$)/i;

  static IMATRIX = /(?:^|[-_.])imatrix(?:[-_.]|$)/i;

  static PROJECTOR_PRECISION = /(?:^|[-_.])(bf16|fp16|f16|fp32|f32|q8_0|q8|q6_k|q5_k|q4_k|q4_0)(?:[-_.]|$)/i;

  static PRECISION_AT_END = /[-_.](bf16|fp16|f16|fp32|f32|q8)$/i;

  static QUANT_ONLY = new RegExp(`^(?:${GgufFileName.QUANT_TOKEN})$`, 'i');

  static PRECISION_ONLY = /^(bf16|fp16|f16|fp32|f32|q8)$/i;

  static DRAFT_HINT = /(?:^|[-_.])(draft|dflash|eagle|medusa)(?:[-_.]|$)/i;

  static EMBEDDING_HINT = /(?:^|[-_.])(embed|embedding|embeddings|bge|gte|e5|nomic-embed|minilm|arctic-embed)(?:[-_.]|$)/i;

  static RERANKER_HINT = /(?:^|[-_.])(rerank|reranker)(?:[-_.]|$)/i;

  static isGguf(path) {
    return /\.gguf$/i.test(path);
  }

  static basename(repoPath) {
    return String(repoPath || '').split('/').pop() || '';
  }

  static split(basename) {
    const stem = String(basename).replace(/\.gguf$/i, '');
    const match = GgufFileName.SHARD_SUFFIX.exec(stem);
    if (!match) return { stem, shard: null };
    return {
      stem: stem.slice(0, match.index),
      shard: { i: Number(match[1]), n: Number(match[2]) },
    };
  }

  static shardIndex(repoPath) {
    const { shard } = GgufFileName.split(GgufFileName.basename(repoPath));
    return shard ? shard.i : 0;
  }

  static quantOf(basename) {
    const { stem } = GgufFileName.split(basename);
    const match = GgufFileName.QUANT_AT_END.exec(stem);
    return match ? match[1].toUpperCase() : null;
  }

  static isMtpHead(repoPath) {
    const path = String(repoPath || '');
    return GgufFileName.MTP_DIR.test(path) || GgufFileName.MTP_BASENAME.test(GgufFileName.basename(path));
  }

  static isMmproj(basename) {
    return GgufFileName.MMPROJ.test(basename);
  }

  static isImatrix(basename) {
    return GgufFileName.IMATRIX.test(basename);
  }

  static projectorPrecision(basename) {
    const match = GgufFileName.PROJECTOR_PRECISION.exec(String(basename));
    return match ? match[1].toUpperCase() : null;
  }

  static bitWidth(quant) {
    const match = /(\d+)/.exec(String(quant || ''));
    return match ? Number(match[1]) : null;
  }

  static roleHint(repoPath) {
    const base = GgufFileName.basename(repoPath);
    if (GgufFileName.isMmproj(base)) return 'mmproj';
    if (GgufFileName.isMtpHead(repoPath)) return 'mtp';
    if (GgufFileName.DRAFT_HINT.test(base)) return 'draft';
    if (GgufFileName.RERANKER_HINT.test(base)) return 'reranker';
    if (GgufFileName.EMBEDDING_HINT.test(base)) return 'embedding';
    return null;
  }

  static familyKey(basename) {
    let { stem } = GgufFileName.split(GgufFileName.basename(basename));
    stem = stem.replace(/^mmproj[-_.]/i, '').replace(/^mtp[-_]/i, '');
    stem = stem.replace(GgufFileName.QUANT_AT_END, '');
    stem = stem.replace(GgufFileName.PRECISION_AT_END, '');
    stem = stem.replace(GgufFileName.QUANT_AT_END, '');
    if (GgufFileName.QUANT_ONLY.test(stem) || GgufFileName.PRECISION_ONLY.test(stem)) return '';
    return stem.toLowerCase().replace(/[-_.\s]+/g, '-').replace(/^-+|-+$/g, '');
  }
}

module.exports = GgufFileName;
