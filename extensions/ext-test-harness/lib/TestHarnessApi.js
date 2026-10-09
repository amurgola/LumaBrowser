class TestHarnessApi {
  static RESPONSE_PREVIEW_CHARS = 200;

  static build(runner, log, config) {
    return {
      config,
      log,
      runPrompt: async (prompt) => {
        const result = await runner.run(prompt);
        log.complete(result);
        return result;
      },
      assert: {
        responseMatches: (response, regex, message) => TestHarnessApi.responseMatches(log, response, regex, message),
        isTrue: (condition, message) => TestHarnessApi.isTrue(log, condition, message),
      },
    };
  }

  static responseMatches(log, response, regex, message) {
    const re = TestHarnessApi._regex(regex);
    const passed = re.test(response);
    const detail = passed
      ? `Matched: ${re}`
      : `No match for ${re} in: "${response.substring(0, TestHarnessApi.RESPONSE_PREVIEW_CHARS)}"`;
    log.addAssertion(message || `Response matches ${re}`, passed, detail);
    return passed;
  }

  static isTrue(log, condition, message) {
    log.addAssertion(message || 'Assertion', !!condition, condition ? 'Passed' : 'Failed');
    return !!condition;
  }

  static _regex(pattern) {
    return typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  }
}

module.exports = TestHarnessApi;
