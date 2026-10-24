const LinkUnwrap = require('./LinkUnwrap');
const TabUrl = require('../../../../core/browser/TabUrl');

class OpenText {
  static DEFAULT_PREFIX = '?';
  static BARE_HOST = /^(localhost|\d{1,3}(\.\d{1,3}){3}|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63})(:\d{1,5})?([/?#]\S*)?$/i;
  static SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

  static classify(text, { askPrefix = OpenText.DEFAULT_PREFIX } = {}) {
    const value = String(text == null ? '' : text).trim();
    if (!value) return { error: 'Empty text' };
    const prefix = String(askPrefix == null ? '' : askPrefix);
    if (prefix && value.startsWith(prefix)) {
      const prompt = value.slice(prefix.length).trim();
      return prompt ? { action: 'ask', prompt } : { error: 'Nothing to ask after the prefix' };
    }
    if (LinkUnwrap.EDGE_SCHEME.test(value) || OpenText.SCHEME.test(value)) return OpenText._fromLink(value);
    if (!/\s/.test(value) && OpenText.BARE_HOST.test(value)) return OpenText._fromLink(TabUrl.normalize(value));
    return { action: 'query', query: value };
  }

  static _fromLink(link) {
    const result = LinkUnwrap.unwrap(link);
    if (result.kind === 'query') return { action: 'query', query: result.query, url: result.url, wrapped: result.wrapped };
    if (result.kind === 'url') return { action: 'url', url: result.url, news: result.news, wrapped: result.wrapped };
    return { error: result.error };
  }
}

module.exports = OpenText;
