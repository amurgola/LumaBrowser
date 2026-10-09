import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class TurnTimings {
  static normalize(t) {
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
    };
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
