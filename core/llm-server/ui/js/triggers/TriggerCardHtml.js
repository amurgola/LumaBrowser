import HtmlEscaper from '../format/HtmlEscaper.js';
import TriggerText from './TriggerText.js';
import TriggerSourceRows from './TriggerSourceRows.js';
import TriggerStatusLines from './TriggerStatusLines.js';
import TriggerCardButtons from './TriggerCardButtons.js';

const esc = HtmlEscaper.escape;

export default class TriggerCardHtml {
  static build(t, state, now = Date.now()) {
    return TriggerCardHtml._head(t, state.running, now)
      + TriggerSourceRows.build(t, state)
      + TriggerStatusLines.build(t, state, now)
      + TriggerCardButtons.build(t, state);
  }

  static _head(t, running, now) {
    const h = TriggerText.headline(t, running);
    return '<div class="cm-trig-head">'
      + '<span class="cm-trig-dot ' + h.cls + '"></span>'
      + '<span class="cm-trig-title">' + esc(h.text) + '</span>'
      + (t.status === 'armed' ? TriggerCardHtml._fires(t, now) : '')
      + '</div>';
  }

  static _fires(t, now) {
    return '<span class="cm-trig-meta">' + esc(String(t.fireCount || 0)) + ' fire' + (t.fireCount === 1 ? '' : 's')
      + (t.lastFiredAt ? ', last ' + esc(TriggerText.when(t.lastFiredAt, now)) + (t.lastStatus ? ' (' + esc(t.lastStatus) + ')' : '') : '')
      + '</span>';
  }
}
