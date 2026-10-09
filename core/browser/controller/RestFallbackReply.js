const ApiResponse = require('../models/ApiResponse');
const NavigationStamp = require('./NavigationStamp');
const SelectorFallback = require('./SelectorFallback');

class RestFallbackReply {
  static NO_SELECTOR_ERROR = 'LLM could not resolve a selector';

  static build(outcome, spec) {
    if (!outcome.ok) return RestFallbackReply._failure(outcome, spec);
    const data = RestFallbackReply._data(outcome, spec);
    return { status: 200, response: ApiResponse.success(data, RestFallbackReply._message(outcome, spec)) };
  }

  static _data(outcome, spec) {
    const { result } = outcome;
    const resolved = outcome.via !== SelectorFallback.VIA_PRIMARY;
    if (!resolved && !spec.stampNavigation) return result.data;
    const data = resolved ? { ...result.data, resolvedSelector: outcome.resolvedSelector } : { ...result.data };
    return spec.stampNavigation ? NavigationStamp.apply(data, result) : data;
  }

  static _message(outcome, spec) {
    if (outcome.via === SelectorFallback.VIA_DIRECT) return `${spec.ok} (resolved by LLM)`;
    if (outcome.via === SelectorFallback.VIA_RECOVERED) return `${spec.ok} (resolved by LLM fallback)`;
    return spec.ok;
  }

  static _failure(outcome, spec) {
    const error = outcome.result ? outcome.result.error : RestFallbackReply.NO_SELECTOR_ERROR;
    return { status: spec.failedStatus || 404, response: ApiResponse.error(error, spec.failed) };
  }
}

module.exports = RestFallbackReply;
