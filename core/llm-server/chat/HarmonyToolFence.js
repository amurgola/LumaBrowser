const ToolArgumentParser = require('./ToolArgumentParser');

class HarmonyToolFence {
  static EXISTING_FENCE = /```\s*tool\b/i;
  static LOST_ARGS_PREVIEW_CHARS = 300;

  static build(text, toolCalls, opts = {}) {
    const content = String(text || '');
    const calls = (Array.isArray(toolCalls) ? toolCalls : []).filter((call) => call && call.name);
    if (!calls.length || HarmonyToolFence.EXISTING_FENCE.test(content)) return content;
    const kept = HarmonyToolFence._dedupe(calls);
    const cutIndex = HarmonyToolFence._cutIndex(kept, calls, !!opts.cutByLength);
    const fences = kept.map((call, i) => HarmonyToolFence._fenceFor(call, i === cutIndex)).join('\n\n');
    return content ? `${content}\n\n${fences}` : fences;
  }

  static _dedupe(calls) {
    const seen = new Set();
    return calls.filter((call) => {
      const signature = HarmonyToolFence._signature(call);
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }

  static _cutIndex(kept, calls, cutByLength) {
    if (!cutByLength) return -1;
    const lastSignature = HarmonyToolFence._signature(calls[calls.length - 1]);
    return kept.findIndex((call) => HarmonyToolFence._signature(call) === lastSignature);
  }

  static _signature(call) {
    return `${call.name} ${call.args || ''}`;
  }

  static _fenceFor(call, cut) {
    const tool = String(call.name).replace(/^functions\./, '');
    const params = call.args ? ToolArgumentParser.parse(call.args) : {};
    return HarmonyToolFence._fence(HarmonyToolFence._payload(tool, params, call.args, cut));
  }

  static _payload(tool, params, rawArgs, cut) {
    if (!params && cut) return { tool, params: {}, __argsCut: true };
    if (!params) return { tool, params: {}, __argsLost: String(rawArgs).slice(0, HarmonyToolFence.LOST_ARGS_PREVIEW_CHARS) };
    if (!cut) return { tool, params };
    return Object.keys(params).length === 0
      ? { tool, params: {}, __argsCut: true }
      : { tool, params, __repaired: true };
  }

  static _fence(payload) {
    return '```tool\n' + JSON.stringify(payload) + '\n```';
  }
}

module.exports = HarmonyToolFence;
