class LookupReply {
  static SEARCH_INSTEAD = 'Do not guess or edit the URL path: run web_search with a "query" and open a result by its '
    + 'number ({"url":"2"}).';

  static OTHER_SOURCE = 'The address is probably right but the site turns automated readers away: use a different '
    + 'source for this information.';

  static ok(message, extra = {}) {
    return { success: true, ...extra, message };
  }

  static fail(problem, nextStep = '') {
    return { success: false, error: nextStep ? `${problem} ${nextStep}` : problem };
  }

  static reasonOf(errorText) {
    return String(errorText || 'unknown error').replace(/\.$/, '');
  }

  static today() {
    return new Date().toISOString().slice(0, 10);
  }
}

module.exports = LookupReply;
