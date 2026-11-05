const FitClassifier = require('./FitClassifier');

class HfModelFilter {
  static NON_CHAT_ARCHITECTURES = new Set([
    'bert', 'nomic-bert', 'nomic-bert-moe', 'jina-bert-v2', 'jina-bert-v3', 'xlm-roberta', 'roberta-bert', 'modern-bert', 'neo-bert',
    'gemma-embedding', 'whisper', 'parakeet', 'audiocpp', 'acestep', 'acestep-lm', 'mert2', 'moss-aud',
    't5', 't5encoder', 'wavtokenizer-dec', 'snac-dec', 'flux', 'sd3', 'sdxl', 'sd1', 'wan', 'ltxv', 'qwen_image',
  ]);

  static PROJECTOR_ARCHITECTURES = new Set(['clip']);

  static NON_CHAT_PIPELINES = new Set([
    'feature-extraction', 'sentence-similarity', 'text-ranking', 'text-classification', 'token-classification', 'zero-shot-classification',
    'fill-mask', 'text-to-speech', 'text-to-audio', 'audio-to-audio', 'audio-classification', 'automatic-speech-recognition',
    'text-to-image', 'image-to-image', 'text-to-video', 'image-to-video', 'image-text-to-video', 'image-classification',
    'object-detection', 'image-segmentation', 'depth-estimation', 'image-feature-extraction', 'voice-activity-detection',
  ]);

  static NON_CHAT_NAMES = /(^|[-_/ .])(mmproj|embed|embedding|embeddings|rerank|reranker|whisper|tts|vocoder|vae|t5xxl|text[-_]encoder)([-_/ .]|$)/i;

  static Q4_BYTES_PER_PARAM = 0.61;

  static HIDDEN_NONE = Object.freeze({ notChat: 0, tooBig: 0 });

  static apply(rows, { hardware = null, fit = false } = {}) {
    const hidden = { notChat: 0, tooBig: 0 };
    const results = [];
    for (const row of rows || []) {
      const verdict = HfModelFilter.verdict(row);
      if (!verdict.usable) { hidden.notChat += 1; continue; }
      const facts = verdict.projectorOnly ? { architecture: null, paramsB: null, maxContext: null } : {};
      const tagged = { ...row, ...facts, fit: HfModelFilter.fitOf(row, hardware) };
      if (fit && tagged.fit && tagged.fit.tier === 'too-big') { hidden.tooBig += 1; continue; }
      results.push(tagged);
    }
    return { results, hidden };
  }

  static verdict(row) {
    const r = row || {};
    const arch = typeof r.architecture === 'string' ? r.architecture.toLowerCase() : '';
    if (arch && HfModelFilter.NON_CHAT_ARCHITECTURES.has(arch)) return { usable: false, reason: `${arch} is not a chat model` };
    const tag = typeof r.pipelineTag === 'string' ? r.pipelineTag.toLowerCase() : '';
    if (tag && HfModelFilter.NON_CHAT_PIPELINES.has(tag)) return { usable: false, reason: `${tag} is not a chat model` };
    if (HfModelFilter.NON_CHAT_NAMES.test(String(r.repoId || ''))) return { usable: false, reason: 'companion or embedding repo' };
    return { usable: true, projectorOnly: !!arch && HfModelFilter.PROJECTOR_ARCHITECTURES.has(arch) };
  }

  static fitOf(row, hardware) {
    const paramsB = Number(row && row.paramsB) || 0;
    if (!hardware || paramsB <= 0 || HfModelFilter.verdict(row).projectorOnly) return null;
    const verdict = FitClassifier.classify({ approxBytes: paramsB * 1e9 * HfModelFilter.Q4_BYTES_PER_PARAM, paramsB, maxContext: row.maxContext }, hardware);
    return { tier: verdict.tier, badge: verdict.badge, label: verdict.label, speedLabel: verdict.speedLabel || '' };
  }
}

module.exports = HfModelFilter;
