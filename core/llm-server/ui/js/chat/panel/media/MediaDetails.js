import TurnData from '../../turns/TurnData.js';

export default class MediaDetails {
  static MEDIA_TOOLS = new Set(['generate_image', 'edit_image', 'generate_video', 'animate_image']);

  static of(item) {
    const af = (item && item.artifact) || {};
    const render = (af.render && typeof af.render === 'object') ? af.render : {};
    const prompt = render.prompt || MediaDetails._tracePrompt(item) || '';
    return { prompt, meta: MediaDetails.meta(render), render };
  }

  static meta(r) {
    const out = [];
    if (r.model) out.push(String(r.model));
    if (r.width && r.height) out.push(r.width + ' × ' + r.height);
    if (r.seed != null) out.push('seed ' + r.seed);
    if (r.steps) out.push(r.steps + ' steps');
    if (r.cfgScale != null) out.push('cfg ' + r.cfgScale);
    if (r.sampler) out.push(r.scheduler ? r.sampler + ' / ' + r.scheduler : String(r.sampler));
    if (r.fps) out.push(r.fps + ' fps');
    if (r.frameCount) out.push(r.frameCount + ' frames');
    return out;
  }

  static _tracePrompt(item) {
    const m = item && item.message;
    if (!m || !item.artifact) return '';
    const calls = TurnData.tools(m).filter((t) => t && MediaDetails.MEDIA_TOOLS.has(t.tool) && t.status !== 'err'
      && t.params && typeof t.params.prompt === 'string');
    if (!calls.length) return '';
    const media = TurnData.artifacts(m).filter((a) => a && (a.type === 'image' || a.type === 'video'));
    const at = media.findIndex((a) => a.id === item.artifact.id);
    const call = calls[at >= 0 && at < calls.length ? at : calls.length - 1];
    return call.params.prompt.trim();
  }
}
