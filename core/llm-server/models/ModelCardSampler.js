class ModelCardSampler {
  static NUMBER = '(-?\\d+(?:\\.\\d+)?)';
  static GAP = '[\\s:=`*|"\'~>(]{0,12}';

  static FIELDS = Object.freeze([
    { field: 'temperature', names: 'temperature|temp', min: 0.05, max: 2 },
    { field: 'topP', names: 'top[_\\- ]?p', min: 0.01, max: 1 },
    { field: 'topK', names: 'top[_\\- ]?k', min: 0, max: 1000, integer: true },
    { field: 'minP', names: 'min[_\\- ]?p', min: 0, max: 1 },
    { field: 'repeatPenalty', names: 'rep(?:etition|eat)?[_\\- ]?pen(?:alty)?', min: 0.5, max: 2 },
    { field: 'presencePenalty', names: 'presence[_\\- ]?penalty', min: -2, max: 2 },
  ]);

  static plain(card) {
    return String(card || '')
      .replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, ' ')
      .replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#61;|&equals;/gi, '=')
      .replace(/\s+/g, ' ');
  }

  static fromCard(card) {
    const text = ModelCardSampler.plain(card);
    const out = {};
    for (const f of ModelCardSampler.FIELDS) {
      const re = new RegExp('(?<![A-Za-z0-9_])(?:' + f.names + ')(?![A-Za-z0-9])' + ModelCardSampler.GAP + ModelCardSampler.NUMBER + '(?!\\d|\\.\\d|%)', 'gi');
      const seen = new Set();
      for (const m of text.matchAll(re)) {
        const value = ModelCardSampler._valid(f, Number(m[1]));
        if (value !== null) seen.add(value);
      }
      if (seen.size === 1) out[f.field] = Array.from(seen)[0];
    }
    return out;
  }

  static fromGenerationConfig(config) {
    let cfg = config;
    if (typeof cfg === 'string') { try { cfg = JSON.parse(cfg); } catch (_) { return {}; } }
    if (!cfg || typeof cfg !== 'object' || cfg.do_sample === false) return {};
    const keys = { temperature: 'temperature', topP: 'top_p', topK: 'top_k', minP: 'min_p', repeatPenalty: 'repetition_penalty', presencePenalty: 'presence_penalty' };
    const out = {};
    for (const f of ModelCardSampler.FIELDS) {
      const raw = cfg[keys[f.field]];
      if (typeof raw !== 'number') continue;
      const value = ModelCardSampler._valid(f, raw);
      if (value !== null) out[f.field] = value;
    }
    return out;
  }

  static baseModels(card) {
    const fm = (String(card || '').match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
    const block = (fm.match(/^base_model:[ \t]*(.*(?:\r?\n[ \t]*-[ \t]*.+)*)/m) || [])[1] || '';
    const ids = [];
    for (const m of block.matchAll(/[A-Za-z0-9][\w.\-]*\/[\w.\-]+/g)) if (!ids.includes(m[0])) ids.push(m[0]);
    return ids;
  }

  static isRepackaging(card, repoId = '') {
    const fm = (String(card || '').match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
    const relation = ((fm.match(/^base_model_relation:[ \t]*["']?([A-Za-z_]+)/m) || [])[1] || '').toLowerCase();
    if (relation) return relation === 'quantized';
    return /(?:^|[-_.\/])(?:gguf|mlx|exl[23]|awq|gptq|i?matrix)(?:$|[-_.])/i.test(String(repoId));
  }

  static _valid(f, n) {
    if (!Number.isFinite(n) || n < f.min || n > f.max) return null;
    if (f.integer) return Number.isInteger(n) ? n : null;
    return Math.round(n * 1000) / 1000;
  }
}

module.exports = ModelCardSampler;
