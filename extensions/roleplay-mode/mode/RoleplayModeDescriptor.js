const NarratorContext = require('../prompts/NarratorContext');
const RoleplaySamplers = require('./RoleplaySamplers');
const BodyGrounding = require('../grounding/BodyGrounding');
const SurfaceGrounding = require('../grounding/SurfaceGrounding');
const TurnJournal = require('../journal/TurnJournal');
const ReplyLength = require('../prompts/ReplyLength');
const NarratorThinking = require('./NarratorThinking');

class RoleplayModeDescriptor {
  static ID = 'roleplay';
  static TEMPERATURE = 0.9;
  static GROUNDING_MEMORY = 32;
  static _grounding = new Map();

  static build(chat, postProcessor) {
    return {
      id: RoleplayModeDescriptor.ID,
      label: 'Roleplay',
      description: 'Scene-and-character roleplay with living characters, optional avatars and generated images.',
      requirements: ['llm'],
      choices: false,
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
    const started = Date.now();
    const grounding = await RoleplayModeDescriptor.grounding(meta);
    const bodyMs = Date.now() - started;
    const surface = await RoleplayModeDescriptor.surface(meta, args.messages);
    RoleplayModeDescriptor.journalGrounding(args, meta, { grounding, surface, bodyMs, surfaceMs: Date.now() - started - bodyMs });
    const stateInHead = !(args.capabilities && args.capabilities.turnPrompt === true);
    const turn = RoleplayModeDescriptor.buildTurn(meta, Object.assign({}, args, { grounding, surface, stateInHead }));
    RoleplayModeDescriptor.rememberGrounding(args.conversationId, turn.groundingNotes || null);
    ReplyLength.remember(args.conversationId, turn.wordCap || 0);
    return turn;
  }

  static journalGrounding(args, meta, { grounding, surface, bodyMs, surfaceMs }, { journal = TurnJournal.shared, body = BodyGrounding.shared(), near = SurfaceGrounding.shared() } = {}) {
    try {
      if (!journal.active(args.conversationId)) return;
      const data = (meta && meta.data) || {};
      const present = NarratorContext.cast(data).present;
      const cards = (notes, c) => ((notes && notes[c.id]) || []).map((n) => ({ id: n.id || '', title: n.title || '', chars: String(n.body || '').length }));
      const available = (g) => { try { return !!(g.rag ? g.rag() : g.scope && g.scope.rag()); } catch (_) { return false; } };
      journal.grounding({
        conversationId: args.conversationId,
        body: {
          enabled: BodyGrounding.enabled(data), available: available(body), ms: bodyMs,
          cast: present.map((c) => ({ name: c.name, lookedUpBy: BodyGrounding.describe(c), cards: cards(grounding, c) })),
        },
        surface: {
          enabled: SurfaceGrounding.enabled(data), available: available(near), ms: surfaceMs,
          playerText: NarratorContext.playerMove(args.messages),
          cast: present.map((c) => ({ name: c.name, condition: (c.state && c.state.condition) || '', cards: cards(surface, c) })),
        },
      });
    } catch (_) {}
  }

  static rememberGrounding(conversationId, notes) {
    if (!conversationId) return;
    const map = RoleplayModeDescriptor._grounding;
    map.delete(conversationId);
    map.set(conversationId, notes);
    while (map.size > RoleplayModeDescriptor.GROUNDING_MEMORY) map.delete(map.keys().next().value);
  }

  static lastGrounding(conversationId) {
    return RoleplayModeDescriptor._grounding.get(conversationId) || null;
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

  static buildTurn(meta, { messages = [], contextWindow = null, grounding = null, surface = null, stateInHead = false } = {}) {
    const data = (meta && meta.data) || {};
    const ctx = NarratorContext.build(data, { messages, contextWindow, grounding, surface, stateInHead });
    const turn = {
      systemPrompt: ctx.systemPrompt,
      postHistoryPrompt: ctx.postHistoryPrompt,
      temperature: RoleplayModeDescriptor.TEMPERATURE,
      compact: false,
    };
    if (ctx.turnPrompt) turn.turnPrompt = ctx.turnPrompt;
    if (ctx.wordCap) turn.wordCap = ctx.wordCap;
    if (ctx.dropped > 0 || ctx.cleaned > 0) turn.messages = ctx.messages;
    if (data.llmModel && typeof data.llmModel === 'string') turn.modelRef = data.llmModel;
    const samplers = RoleplaySamplers.forTurn(data);
    const cap = RoleplaySamplers.replyCap(ctx.wordCap);
    const thinking = NarratorThinking.samplerFields(data);
    if (samplers || cap || Object.keys(thinking).length) turn.samplers = Object.assign({}, samplers || {}, cap ? { max_tokens: cap } : {}, thinking);
    const effort = NarratorThinking.effort(data);
    if (effort) turn.reasoningEffort = effort;
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
