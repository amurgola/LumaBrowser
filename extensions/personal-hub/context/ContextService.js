const RecordId = require('../../../core/database/RecordId');

class ContextService {
  static ID_PREFIX = 'ctx';
  static HEX_COLOR = /^#[0-9a-f]{3,8}$/i;
  static PALETTE = ['#60a5fa', '#a78bfa', '#34d399', '#f472b6', '#22d3ee', '#facc15', '#fb923c', '#94a3b8'];
  static KINDS = ['url', 'partition', 'domain', 'app', 'calendar', 'tasks'];
  static ITEM_KINDS = ['url', 'partition', 'domain', 'app'];

  constructor({ contexts, emit = () => {} }) {
    this._contexts = contexts;
    this._emit = emit;
  }

  list() {
    return this._contexts.list();
  }

  save(contexts) {
    if (!Array.isArray(contexts)) throw new Error('Send the contexts as a list.');
    const names = new Set();
    const taken = new Set();
    const clean = contexts.map((context, index) => ContextService._clean(context, index, names, taken));
    const saved = this._contexts.replaceAll(clean);
    this._emit('context.changed', { reason: 'saved' });
    return saved;
  }

  resolve(facts = {}, contexts = this.list()) {
    const named = ContextService._named(facts.named, contexts);
    if (named) return named;
    const tests = {
      url: (value) => !!facts.url && String(facts.url).toLowerCase().includes(value),
      partition: (value) => !!facts.partition && String(facts.partition).toLowerCase() === value,
      domain: (value) => ContextService._domainMatches(facts.host, value) || ContextService._domainMatches(ContextService._mailDomain(facts.sender), value),
      app: (value) => !!facts.app && String(facts.app).toLowerCase() === value,
    };
    for (const kind of ContextService.ITEM_KINDS) {
      for (const context of contexts) {
        if (context.rules.some((rule) => rule.kind === kind && tests[kind](rule.value.toLowerCase()))) return context.id;
      }
    }
    return null;
  }

  forItem(item, contexts = this.list()) {
    const last = (item && item.lastNotification) || {};
    return this.resolve({
      url: last.url || (item && item.url) || '',
      partition: last.partition || '',
      host: last.host || '',
      sender: last.sender || ((item && item.participants) || []).join(' '),
      app: item && item.app,
      named: item && item.context && (item.context.hubContext || item.context.company),
    }, contexts);
  }

  forSource(kind, sourceId, contexts = this.list()) {
    if (!sourceId) return null;
    const context = contexts.find((c) => c.rules.some((rule) => rule.kind === kind && rule.value === String(sourceId)));
    return context ? context.id : null;
  }

  static _named(value, contexts) {
    const wanted = String(value || '').trim().toLowerCase();
    if (!wanted) return null;
    const context = contexts.find((c) => c.id.toLowerCase() === wanted || c.name.toLowerCase() === wanted);
    return context ? context.id : null;
  }

  static _domainMatches(host, domain) {
    const h = String(host || '').toLowerCase().replace(/^www\./, '');
    return !!h && !!domain && (h === domain || h.endsWith(`.${domain}`));
  }

  static _mailDomain(sender) {
    const match = String(sender || '').match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
    return match ? match[1] : '';
  }

  static _clean(context, index, names, taken) {
    const name = String((context && context.name) || '').trim();
    if (!name) throw new Error('Every context needs a name.');
    if (names.has(name.toLowerCase())) throw new Error(`Two contexts are named "${name}".`);
    names.add(name.toLowerCase());
    const color = ContextService.HEX_COLOR.test(String((context && context.color) || ''))
      ? String(context.color) : ContextService.PALETTE[index % ContextService.PALETTE.length];
    const rules = [];
    for (const rule of (context && context.rules) || []) {
      const kind = String((rule && rule.kind) || '');
      const value = ContextService._ruleValue(kind, rule && rule.value);
      if (!ContextService.KINDS.includes(kind)) throw new Error(`Unknown rule kind "${kind}".`);
      const key = `${kind}:${value.toLowerCase()}`;
      if (!value || taken.has(key)) continue;
      taken.add(key);
      rules.push({ kind, value });
    }
    return { id: (context && context.id) || RecordId.create(ContextService.ID_PREFIX), name, color, sortOrder: index, rules };
  }

  static _ruleValue(kind, value) {
    const text = String(value == null ? '' : value).trim();
    if (kind !== 'domain') return text;
    return text.toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^.*@/, '').replace(/^www\./, '').replace(/[/?#].*$/, '');
  }
}

module.exports = ContextService;
