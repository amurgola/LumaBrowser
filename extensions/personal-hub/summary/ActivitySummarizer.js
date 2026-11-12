const crypto = require('crypto');
const ResponseText = require('../../../core/llm-service/ResponseText');
const SummaryPrompt = require('./SummaryPrompt');

class ActivitySummarizer {
  static SLOT = 'personal-hub.summarizer';
  static ENABLED_KEY = 'summary.enabled';
  static OTHER_KEY = 'other';
  static OTHER_NAME = 'Other';
  static WINDOW_DAYS = 3;
  static MAX_ITEMS = 300;
  static MAX_ITEMS_PER_CARD = 25;
  static RULE_TITLES = 3;
  static DEBOUNCE_MS = 15000;
  static MAX_TOKENS = 700;
  static DEEP_PER_CARD = 3;

  constructor({ inbox, contexts, summaries, db, llm = null, reader = null, people = null, emit = () => {}, now = () => new Date(), debounceMs = ActivitySummarizer.DEBOUNCE_MS }) {
    this._reader = reader;
    this._people = people;
    this._inbox = inbox;
    this._contexts = contexts;
    this._summaries = summaries;
    this._db = db;
    this._llm = llm;
    this._emit = emit;
    this._now = now;
    this._debounceMs = debounceMs;
    this._timer = null;
    this._running = null;
    this._again = false;
    this._lastRunAt = null;
    this._lastError = null;
  }


  status() {
    const slot = this._describeSlot();
    return {
      enabled: this.enabled(),
      available: !!this._llm,
      provider: slot.provider,
      model: slot.model,
      running: !!this._running,
      lastRunAt: this._lastRunAt,
      lastError: this._lastError,
    };
  }

  enabled() {
    return this._db.get(ActivitySummarizer.ENABLED_KEY, false) === true;
  }

  models() {
    if (!this._llm || typeof this._llm.getAllAvailableModels !== 'function') return { models: [], chosen: '' };
    const models = (this._llm.getAllAvailableModels() || []).map((m) => ({ value: `${m.providerId}::${m.modelId}`, label: m.label }));
    let slot = null;
    try { slot = this._llm.getSlotConfig(ActivitySummarizer.SLOT); } catch (_) { slot = null; }
    return { models, chosen: slot && slot.provider && slot.model ? `${slot.provider}::${slot.model}` : '' };
  }

  setModel(value) {
    if (!this._llm) throw new Error('No language model service is available to the Hub.');
    const [provider, ...rest] = String(value || '').split('::');
    const model = rest.join('::');
    if (provider && model) this._llm.setSlotConfig(ActivitySummarizer.SLOT, provider, model);
    else this._llm.clearSlotConfig(ActivitySummarizer.SLOT);
    this._emit('summary.changed', { reason: 'settings' });
    return this.status();
  }

  setEnabled(enabled) {
    this._db.set(ActivitySummarizer.ENABLED_KEY, !!enabled);
    this._emit('summary.changed', { reason: 'settings' });
    if (enabled) this.schedule(0);
    return this.status();
  }


  cards() {
    const stored = this._summaries.all();
    return this._groups().map((group) => ActivitySummarizer._card(group, stored[group.key] || null));
  }


  schedule(delayMs = this._debounceMs) {
    if (!this.enabled() || !this._llm) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => { this.run().catch(() => {}); }, delayMs);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  stop() {
    clearTimeout(this._timer);
    this._timer = null;
  }

  run({ force = false } = {}) {
    if (this._running) {
      this._again = true;
      return this._running;
    }
    this._running = this._run(force).finally(() => {
      this._running = null;
      if (this._again) {
        this._again = false;
        this.schedule(0);
      }
    });
    return this._running;
  }

  async _run(force) {
    clearTimeout(this._timer);
    const result = { written: 0, failed: 0, skipped: 0 };
    if (!this._llm) throw new Error('No language model service is available to the Hub.');
    this._lastError = null;
    const groups = this._groups();
    this._forget(groups);
    for (const group of groups) {
      const stored = this._summaries.get(group.key);
      if (!force && stored && stored.signature === group.signature && stored.summary) {
        result.skipped += 1;
        continue;
      }
      const error = await this._write(group);
      if (error) {
        result.failed += 1;
        this._lastError = error;
      } else {
        result.written += 1;
      }
      this._emit('summary.changed', { key: group.key, reason: error ? 'failed' : 'written' });
    }
    this._lastRunAt = this._now().toISOString();
    this._emit('summary.changed', { reason: 'run' });
    return result;
  }

  async _write(group) {
    const items = group.items.slice(0, ActivitySummarizer.MAX_ITEMS_PER_CARD);
    const previous = this._summaries.get(group.key);
    const fail = (error) => {
      this._summaries.save({ key: group.key, signature: previous ? previous.signature : '', summary: previous ? previous.summary : null, model: previous ? previous.model : '', error });
      return error;
    };
    const first = await this._ask(group, items);
    if (first.error) return fail(first.error);
    let summary = first.summary;
    if (summary.needsYou && await this._deepen(items, summary)) {
      const second = await this._ask(group, items);
      if (second.summary) summary = second.summary;
    }
    this._summaries.save({ key: group.key, signature: group.signature, summary, model: this._describeSlot().model || '', error: null });
    return null;
  }

  async _ask(group, items) {
    let reply;
    try {
      reply = await this._llm.sendCompletion(ActivitySummarizer.SLOT, SummaryPrompt.messages({ name: group.name }, this._enrich(items), { now: this._now() }), {
        temperature: 0.2, max_tokens: ActivitySummarizer.MAX_TOKENS, label: `Hub summary: ${group.name}`,
      });
    } catch (err) {
      return { error: (err && err.message) || String(err) };
    }
    if (!reply || reply.success === false) return { error: (reply && reply.error) || 'The model did not answer.' };
    const summary = SummaryPrompt.parse(ResponseText.extract(reply.response), items);
    return summary ? { summary } : { error: 'The model did not answer in the expected form.' };
  }

  _enrich(items) {
    const snapshots = this._reader ? this._reader.forItems(items) : {};
    return items.map((item) => {
      const snapshot = snapshots[item.id];
      return {
        ...item,
        people: this._names(item),
        snapshot: snapshot && snapshot.sourceAt === (item.lastAt || '') ? snapshot.text : '',
      };
    });
  }

  _names(item) {
    if (!this._people) return item.participants || [];
    return (item.participants || []).map((name) => {
      let contact = null;
      try { contact = this._people.lookup({ app: item.app, sender: name, contextId: item.contextId || null }); } catch (_) { contact = null; }
      if (!contact) return name;
      const others = [...new Set(contact.identities.map((i) => i.app).filter((app) => app && app !== item.app))];
      return `${contact.name}${others.length ? ` (also on ${others.join(', ')})` : ''}`;
    });
  }

  async _deepen(items, summary) {
    if (!this._reader || !this._reader.available()) return false;
    const asked = new Set(summary.asks.map((ask) => ask.threadId));
    const targets = (asked.size ? items.filter((i) => asked.has(i.id)) : items.slice(0, 1)).slice(0, ActivitySummarizer.DEEP_PER_CARD);
    let read = 0;
    for (const item of targets) {
      const kept = this._reader.stored(item);
      if (kept && kept.fresh) continue;
      try {
        const result = await this._reader.read(item);
        if (result && result.snapshot && result.snapshot.fresh) read += 1;
      } catch (_) {}
    }
    return read > 0;
  }

  _forget(groups) {
    const live = new Set(groups.map((g) => g.key));
    for (const key of Object.keys(this._summaries.all())) {
      if (!live.has(key)) this._summaries.delete(key);
    }
  }


  _groups() {
    const contexts = this._contexts.list();
    const since = new Date(this._now().getTime() - ActivitySummarizer.WINDOW_DAYS * 86400000).toISOString();
    const items = this._inbox.listThreads({ state: 'active', since, limit: ActivitySummarizer.MAX_ITEMS });
    const byKey = new Map();
    for (const item of items) {
      const contextId = this._contexts.forItem(item, contexts);
      const key = contextId || ActivitySummarizer.OTHER_KEY;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ ...item, contextId });
    }
    const groups = [];
    for (const context of contexts) {
      if (byKey.has(context.id)) groups.push(ActivitySummarizer._group(context.id, context.id, context.name, context.color, byKey.get(context.id)));
    }
    if (byKey.has(ActivitySummarizer.OTHER_KEY)) {
      groups.push(ActivitySummarizer._group(ActivitySummarizer.OTHER_KEY, null, contexts.length ? ActivitySummarizer.OTHER_NAME : 'Everything', '', byKey.get(ActivitySummarizer.OTHER_KEY)));
    }
    return groups;
  }

  static _group(key, contextId, name, color, items) {
    const sorted = items.slice().sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')));
    const parts = sorted.slice(0, ActivitySummarizer.MAX_ITEMS_PER_CARD).map((i) => `${i.id}:${i.lastAt}:${i.count}:${i.summary || ''}`);
    const signature = crypto.createHash('sha1').update(`${name}\n${parts.join('\n')}`).digest('hex');
    return { key, contextId, name, color, items: sorted, signature };
  }

  static _card(group, stored) {
    const ai = stored && stored.summary ? stored.summary : null;
    const text = ai || ActivitySummarizer._byRules(group.items);
    const live = new Set(group.items.map((i) => i.id));
    return {
      key: group.key,
      contextId: group.contextId,
      name: group.name,
      color: group.color,
      count: group.items.length,
      lastAt: group.items[0] ? group.items[0].lastAt : null,
      items: group.items,
      headline: text.headline,
      summary: text.summary,
      needsYou: !!text.needsYou,
      reason: text.reason || '',
      asks: (text.asks || []).filter((ask) => live.has(ask.threadId)),
      source: ai ? 'ai' : 'rules',
      stale: !!ai && stored.signature !== group.signature,
      updatedAt: ai ? stored.updatedAt : null,
      error: stored ? stored.error : null,
    };
  }

  static _byRules(items) {
    const notable = items.filter((i) => i.priority === 'high' || i.priority === 'urgent');
    const titles = items.slice(0, ActivitySummarizer.RULE_TITLES).map((i) => i.title || (i.participants || []).join(', ') || i.app).filter(Boolean);
    const more = items.length - titles.length;
    return {
      headline: `${items.length} item${items.length === 1 ? '' : 's'}`,
      summary: `${titles.join('; ')}${more > 0 ? `; and ${more} more` : ''}`,
      needsYou: notable.length > 0,
      reason: notable.length ? `${notable.length} marked ${notable.some((i) => i.priority === 'urgent') ? 'urgent' : 'high priority'}` : '',
      asks: notable.slice(0, SummaryPrompt.MAX_ASKS).map((i) => ({ threadId: i.id, what: i.title || 'Marked high priority' })),
    };
  }

  _describeSlot() {
    if (!this._llm || typeof this._llm.describeSlot !== 'function') return { provider: null, model: null };
    try { return this._llm.describeSlot(ActivitySummarizer.SLOT) || { provider: null, model: null }; } catch (_) { return { provider: null, model: null }; }
  }
}

module.exports = ActivitySummarizer;
