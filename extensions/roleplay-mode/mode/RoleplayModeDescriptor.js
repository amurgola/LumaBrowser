const NarratorContext = require('../prompts/NarratorContext');
const RoleplaySamplers = require('./RoleplaySamplers');
const BodyGrounding = require('../grounding/BodyGrounding');
const SurfaceGrounding = require('../grounding/SurfaceGrounding');

class RoleplayModeDescriptor {
  static ID = 'roleplay';
  static TEMPERATURE = 0.9;

  static build(chat, postProcessor) {
    return {
      id: RoleplayModeDescriptor.ID,
      label: 'Roleplay',
      description: 'Scene-and-character roleplay with living characters, optional avatars and generated images.',
      requirements: ['llm'],
      chatUiUrl: chat.uiUrl('chat-ui.js'),
      buildTurn: (args) => RoleplayModeDescriptor._prepared(postProcessor, args || {}),
      postProcess: (args) => postProcessor.process(args),
    };
  }

  static async _prepared(postProcessor, args) {
    let meta = args.meta;
    if (postProcessor && typeof postProcessor.prepareTurn === 'function') {
      try { meta = (await postProcessor.prepareTurn(args)) || meta; } catch (_) {}
    }
    const grounding = await RoleplayModeDescriptor.grounding(meta);
    const surface = await RoleplayModeDescriptor.surface(meta, args.messages);
    return RoleplayModeDescriptor.buildTurn(meta, Object.assign({}, args, { grounding, surface }));
  }

  static async grounding(meta, bodyGrounding = BodyGrounding.shared()) {
    const data = (meta && meta.data) || {};
    if (!BodyGrounding.enabled(data)) return null;
    try {
      const notes = await bodyGrounding.forCast(NarratorContext.cast(data).present);
      return Object.keys(notes).length ? notes : null;
    } catch (_) {
      return null;
    }
  }

  static async surface(meta, messages, surfaceGrounding = SurfaceGrounding.shared()) {
    const data = (meta && meta.data) || {};
    if (!SurfaceGrounding.enabled(data)) return null;
    const last = (Array.isArray(messages) ? messages : []).filter((m) => m && m.role === 'user').pop();
    const text = last && typeof last.content === 'string' ? last.content : '';
    if (!text) return null;
    try {
      const notes = await surfaceGrounding.forMoment(NarratorContext.cast(data).present, text);
      return Object.keys(notes).length ? notes : null;
    } catch (_) {
      return null;
    }
  }

  static buildTurn(meta, { messages = [], contextWindow = null, grounding = null, surface = null } = {}) {
    const data = (meta && meta.data) || {};
    const ctx = NarratorContext.build(data, { messages, contextWindow, grounding, surface });
    const turn = {
      systemPrompt: ctx.systemPrompt,
      postHistoryPrompt: ctx.postHistoryPrompt,
      temperature: RoleplayModeDescriptor.TEMPERATURE,
      compact: false,
    };
    if (ctx.dropped > 0 || ctx.cleaned > 0) turn.messages = ctx.messages;
    if (data.llmModel && typeof data.llmModel === 'string') turn.modelRef = data.llmModel;
    const samplers = RoleplaySamplers.forTurn(data);
    if (samplers) turn.samplers = samplers;
    const groundingNotes = RoleplayModeDescriptor.groundingLog(grounding, surface);
    if (groundingNotes) turn.groundingNotes = groundingNotes;
    return turn;
  }

  static groundingLog(grounding, surface) {
    const ids = (g) => Object.fromEntries(Object.entries(g || {}).map(([k, v]) => [k, (v || []).map((n) => n.id || n.title)]));
    const body = ids(grounding);
    const near = ids(surface);
    return Object.keys(body).length || Object.keys(near).length ? { body, surface: near } : null;
  }
}

module.exports = RoleplayModeDescriptor;
