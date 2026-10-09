const AddressGuard = require('../safe-fetch/AddressGuard');

class PageClassifier {
  static WALL_MAX_CHARS = 8000;
  static WALL_PHRASES = [
    'just a moment',
    'checking your browser',
    'verify you are human',
    'verifying you are human',
    'enable javascript and cookies to continue',
    'attention required! | cloudflare',
    'cf-chl', 'cf-turnstile', 'challenge-platform',
    'detected an anomaly',
    'bots use duckduckgo too',
    'unusual traffic from your',
    'are you a robot',
    'captcha',
  ];

  static NOTHING_FOUND_PHRASES = [
    'no results found',
    'no results for',
    'did not match any documents',
    'there are no results for',
    'check your spelling or try different keywords',
    'try different keywords',
  ];

  static PROSE_MIN_CHARS = 400;
  static PROSE_MIN_SENTENCES = 3;

  static TAB_WORTHY_STATUSES = new Set([401, 403, 406, 408, 425, 429]);

  static isChallenge(text) {
    const s = String(text || '');
    return !!s && s.length <= PageClassifier.WALL_MAX_CHARS && PageClassifier._mentions(s, PageClassifier.WALL_PHRASES);
  }

  static isNothingFound(text) {
    const s = String(text || '');
    return !!s && PageClassifier._mentions(s, PageClassifier.NOTHING_FOUND_PHRASES);
  }

  static isProse(text) {
    const s = String(text || '').trim();
    if (s.length < PageClassifier.PROSE_MIN_CHARS) return false;
    const sentenceEnds = s.match(/[.!?]["')\]]?(\s|$)/g) || [];
    return sentenceEnds.length >= PageClassifier.PROSE_MIN_SENTENCES;
  }

  static tabMightSucceed(res) {
    if (!res.ok) return !AddressGuard.isRefusal(res.error);
    return res.status >= 500 || PageClassifier.TAB_WORTHY_STATUSES.has(res.status);
  }

  static _mentions(text, phrases) {
    const lower = text.toLowerCase();
    return phrases.some((phrase) => lower.includes(phrase));
  }
}

module.exports = PageClassifier;
