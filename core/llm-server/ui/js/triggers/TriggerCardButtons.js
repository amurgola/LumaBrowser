import HtmlEscaper from '../format/HtmlEscaper.js';
import TriggerIcons from './TriggerIcons.js';

export default class TriggerCardButtons {
  static DEFAULT_SAMPLE = '{ "text": "hello world" }';

  static build(t, state) {
    const dis = state.busy || state.running ? ' disabled' : '';
    const buttons = [
      ...TriggerCardButtons._lifecycle(t, dis),
      TriggerCardButtons._sampleButton(t, dis),
    ];
    if (t.runCount > 0 || t.status === 'armed') buttons.push(TriggerCardButtons._button('runs', '', TriggerIcons.LIST + 'View runs', ''));
    const row = '<div class="cm-trig-actions">' + buttons.join('') + '</div>';
    return state.composerOpen ? row + TriggerCardButtons._composer(t, state, dis) : row;
  }

  static _lifecycle(t, dis) {
    const out = [];
    if (t.status === 'needs_test' || t.status === 'tested') {
      out.push(TriggerCardButtons._button('test', ' primary', TriggerIcons.PLAY + (t.status === 'tested' ? 'Test again' : 'Test now'), dis));
    }
    if (t.status === 'tested') out.push(TriggerCardButtons._button('arm', ' primary', TriggerIcons.BOLT + 'Arm', dis));
    if (t.status === 'auto_paused') {
      out.push(TriggerCardButtons._button('arm', ' primary', TriggerIcons.PLAY + 'Resume', dis));
      out.push(TriggerCardButtons._button('test', '', TriggerIcons.PLAY + 'Test again', dis));
    }
    if (t.status === 'armed') out.push(TriggerCardButtons._button('pause', '', TriggerIcons.PAUSE + 'Pause', dis));
    return out;
  }

  static _sampleButton(t, dis) {
    const awaiting = t.status === 'awaiting_sample';
    const armed = t.status === 'armed';
    if (t.kind === 'file') {
      return TriggerCardButtons._button('pickfile', '', TriggerIcons.SEND
        + (awaiting ? 'Use a file…' : (armed ? 'Run with a file…' : 'Replace sample…')), dis);
    }
    if (t.kind === 'page') {
      return TriggerCardButtons._button('latest', '', TriggerIcons.SEND
        + (awaiting ? 'Use latest check' : (armed ? 'Run with latest check' : 'Replace sample')), dis);
    }
    return TriggerCardButtons._button('compose', '', TriggerIcons.SEND
      + (awaiting ? 'Send a sample' : (armed ? 'Send a test event' : 'Replace sample')), dis);
  }

  static _composer(t, state, dis) {
    const hint = t.status === 'awaiting_sample' ? 'Stored as the sample, not run.'
      : (t.status === 'armed' ? 'Runs now as a manual event (does not count as a fire).' : 'Runs a test with this payload.');
    return '<div class="cm-trig-compose">'
      + '<textarea class="cm-trig-ta" rows="3" spellcheck="false" placeholder="JSON body, or plain text">'
      + HtmlEscaper.escape(state.composeText || TriggerCardButtons.DEFAULT_SAMPLE) + '</textarea>'
      + '<div class="cm-trig-compose-row">'
      + '<span class="cm-trig-hint">' + hint + '</span>'
      + '<button type="button" class="cm-sched-btn" data-act="cancel">Cancel</button>'
      + TriggerCardButtons._button('send', ' primary', TriggerIcons.SEND + 'Send', dis)
      + '</div></div>';
  }

  static _button(act, cls, inner, dis) {
    return '<button type="button" class="cm-sched-btn' + cls + '" data-act="' + act + '"' + dis + '>' + inner + '</button>';
  }
}
