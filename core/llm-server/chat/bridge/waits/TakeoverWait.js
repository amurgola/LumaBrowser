const HumanWait = require('./HumanWait');

class TakeoverWait extends HumanWait {
  static TIMEOUT_MS = 4 * 60 * 1000;

  static CONTINUE = 'The user says they have handled it in the working tab (login/verification done). '
    + 'The page has likely changed; re-check the live state (observe_page or get_source) before your next action.';

  static SKIP = 'The user chose to SKIP the blocked step. Continue the task without it; '
    + 'if that makes the goal impossible, finish by plainly reporting what was blocked.';

  static TIMED_OUT = 'No response from the user after several minutes. Continue without the blocked step '
    + 'and plainly report what you could not do.';

  _defaultTimeoutMs() {
    return TakeoverWait.TIMEOUT_MS;
  }

  _normalize(action) {
    if (action === 'skip') return 'skip';
    return action === 'stop' ? 'stop' : 'continue';
  }

  _supersededAnswer() {
    return 'skip';
  }

  _resultFor(action) {
    if (action === 'continue') return { success: true, message: TakeoverWait.CONTINUE };
    if (action === 'skip') return { success: true, message: TakeoverWait.SKIP };
    if (action === 'stop') return { success: false, error: 'stopped' };
    return { success: true, message: TakeoverWait.TIMED_OUT };
  }
}

module.exports = TakeoverWait;
