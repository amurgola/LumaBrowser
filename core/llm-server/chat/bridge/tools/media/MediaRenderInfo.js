class MediaRenderInfo {
  static PROMPT_MAX = 4000;

  static from({ tool, prompt, media, result }) {
    const m = media || {};
    const r = result || {};
    const s = r.settings || {};
    const info = {
      tool: tool || null,
      prompt: typeof prompt === 'string' ? prompt.slice(0, MediaRenderInfo.PROMPT_MAX) : null,
      model: r.modelId || null,
      seed: MediaRenderInfo._num(m.seed),
      width: MediaRenderInfo._num(m.width),
      height: MediaRenderInfo._num(m.height),
      steps: MediaRenderInfo._num(s.steps),
      cfgScale: MediaRenderInfo._num(s.cfgScale),
      sampler: s.sampler || null,
      scheduler: s.scheduler || null,
      fps: MediaRenderInfo._num(m.fps),
      frameCount: MediaRenderInfo._num(m.frameCount),
    };
    const out = {};
    for (const [k, v] of Object.entries(info)) if (v != null && v !== '') out[k] = v;
    return out;
  }

  static attach(artifact, render) {
    if (!artifact || !render || !Object.keys(render).length) return artifact;
    return { ...artifact, render };
  }

  static _num(v) {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
}

module.exports = MediaRenderInfo;
