import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class TurnTimings {
  static normalize(t, speculation = null) {
    if (!t || typeof t !== 'object') return null;
    const promptPerSec = TurnTimings._rate(t.prompt_per_second, t.prompt_n, t.prompt_ms);
    const genPerSec = TurnTimings._rate(t.predicted_per_second, t.predicted_n, t.predicted_ms);
    if (promptPerSec == null && genPerSec == null) return null;
    return {
      promptPerSec: TurnTimings._oneDecimal(promptPerSec),
      genPerSec: TurnTimings._oneDecimal(genPerSec),
      promptMs: Number(t.prompt_ms) || null,
      predictedMs: Number(t.predicted_ms) || null,
      promptN: Number(t.prompt_n) || null,
      predictedN: Number(t.predicted_n) || null,
      draftN: Number.isFinite(t.draft_n) ? t.draft_n : null,
      draftAccepted: Number.isFinite(t.draft_n_accepted) ? t.draft_n_accepted : null,
      speculation: TurnTimings._speculation(speculation),
    };
  }

  static _speculation(s) {
    if (!s || typeof s !== 'object' || typeof s.kind !== 'string') return null;
    return { kind: s.kind, label: String(s.label || s.kind), specType: s.specType || null, draftNMax: Number(s.draftNMax) || null };
  }

  static speculationLines(t) {
    const lines = [];
    const s = t.speculation;
    if (s) {
      const bits = [s.specType, s.draftNMax ? `up to ${s.draftNMax} tokens per step` : null].filter(Boolean);
      lines.push('Speculative decoding: ' + s.label + (bits.length ? ' (' + bits.join(', ') + ')' : ''));
    }
    if (t.draftN > 0) {
      const accepted = t.draftAccepted != null ? t.draftAccepted : 0;
      lines.push('Drafted ' + t.draftN + ' tok, ' + accepted + ' accepted (' + Math.round((accepted / t.draftN) * 100) + '%)');
    } else if (s && s.kind !== 'none') {
      lines.push('No drafted tokens reported for this turn');
    }
    return lines;
  }

  static pillHtml(t) {
    if (!t) return '';
    const parts = [];
    const titleBits = [];
    if (t.promptPerSec != null) {
      parts.push('pp ' + t.promptPerSec + ' t/s');
      titleBits.push('Prompt processing: ' + t.promptPerSec + ' tok/s' + TurnTimings._countText(t.promptN, t.promptMs));
    }
    if (t.genPerSec != null) {
      parts.push('gen ' + t.genPerSec + ' t/s');
      titleBits.push('Generation: ' + t.genPerSec + ' tok/s' + TurnTimings._countText(t.predictedN, t.predictedMs));
    }
    if (!parts.length) return '';
    titleBits.push(...TurnTimings.speculationLines(t));
    return '<span class="cm-act-speed" title="' + HtmlEscaper.escape(titleBits.join('\n')) + '">'
      + HtmlEscaper.escape(parts.join(' · ')) + '</span>';
  }

  static _rate(perSecond, n, ms) {
    if (Number.isFinite(perSecond)) return perSecond;
    if (Number(n) > 0 && Number(ms) > 0) return n / (ms / 1000);
    return null;
  }

  static _oneDecimal(v) {
    return v != null ? Math.round(v * 10) / 10 : null;
  }

  static _countText(n, ms) {
    if (!n) return '';
    return ' (' + n + ' tok' + (ms ? ' in ' + Math.round(ms) + ' ms' : '') + ')';
  }
}
