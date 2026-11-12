class JournalMarkdown {
  static FENCE = '````';

  static render(event) {
    const fn = JournalMarkdown['_' + String(event && event.type).replace(/[^a-z]/gi, '_')];
    return typeof fn === 'function' ? fn(event) : '';
  }

  static _setup(e) {
    const s = e.setup || {};
    const lines = ['# Roleplay turn log', '', 'Conversation `' + e.conversationId + '`, started ' + JournalMarkdown._time(e.at) + ', add-on ' + (e.version || '?') + '.',
      '', '## Setup', ''];
    lines.push('- Premise: ' + JournalMarkdown._inline(s.scenario));
    lines.push('- Player: ' + JournalMarkdown._inline(JSON.stringify(s.protagonist || {})));
    lines.push('- Tone: ' + (s.tone || '(none)') + '; reply length: ' + (s.lengthMode || '(default)'));
    lines.push('- Models: story ' + (s.llmModel || '(chat model)') + ', bookkeeping ' + (s.sideModel || '(story model)') + ', context pick ' + (s.llmCtx || '(server)'));
    lines.push('- Options: ' + JournalMarkdown._inline(JSON.stringify(s.options || {})));
    lines.push('- Characters set up: ' + ((s.characters || []).map((c) => c.name).join(', ') || '(none)'));
    lines.push('- Scenes set up: ' + ((s.scenes || []).map((c) => c.name).join(', ') || '(none)'));
    return lines.join('\n');
  }

  static _turn_prepare(e) {
    const lines = ['---', '', '## ' + JournalMarkdown._time(e.at) + ': ' + e.kind, ''];
    if (e.player) lines.push('Player: ' + JournalMarkdown._inline(e.player), '');
    lines.push('- Shown branch: ' + e.path.length + ' messages; the turn continues from ' + e.continues.length + ' of them'
      + (e.headId ? ', story state taken from the point of `' + JournalMarkdown._id(e.headId) + '`' : ', story state is the setup (no point on this branch yet)') + '.');
    if (e.stopped) lines.push('- Stopped ' + e.stopped + ' bookkeeping run(s) for replies this turn does not continue from.');
    lines.push('- Waited ' + e.waitedMs + ' ms for earlier bookkeeping before the prompt was built.');
    lines.push('- State handed to the narrator: turn ' + e.state.turn + (e.state.scene ? ', at ' + e.state.scene : ', no place recorded')
      + ', cast ' + (e.state.cast.join(', ') || '(nobody)') + ', ' + e.state.ledger.length + ' ledger rows, ' + e.state.threads.length + ' open threads.');
    return lines.join('\n');
  }

  static _tree_change(e) {
    const c = e.change;
    const lines = ['### What changed in the story tree since the last turn', ''];
    for (const m of c.messagesRemoved) lines.push('- Removed ' + m.role + ' `' + JournalMarkdown._id(m.id) + '`: ' + JournalMarkdown._inline(m.text));
    for (const m of c.messagesAdded) lines.push('- Added ' + m.role + ' `' + JournalMarkdown._id(m.id) + '`' + (m.active ? '' : ' (off the shown branch)') + ': ' + JournalMarkdown._inline(m.text));
    if (c.branch) {
      lines.push('- The shown branch forks at message ' + (c.branch.at + 1) + ': was ' + (c.branch.was.map((id) => '`' + JournalMarkdown._id(id) + '`').join(' > ') || '(end)')
        + ', now ' + (c.branch.now.map((id) => '`' + JournalMarkdown._id(id) + '`').join(' > ') || '(end)') + '.');
    }
    if (c.pointsDropped.length) lines.push('- Timeline points dropped: ' + c.pointsDropped.map((id) => '`' + JournalMarkdown._id(id) + '`').join(', '));
    if (c.pointsAdded.length) lines.push('- Timeline points added: ' + c.pointsAdded.map((id) => '`' + JournalMarkdown._id(id) + '`').join(', '));
    if (c.headWas !== c.headNow) lines.push('- Head moved from `' + JournalMarkdown._id(c.headWas) + '` to `' + JournalMarkdown._id(c.headNow) + '`.');
    for (const [key, v] of Object.entries(c.state)) {
      if (v.removed || v.added) {
        for (const x of v.removed) lines.push('- State lost (' + key + '): ' + JournalMarkdown._inline(x));
        for (const x of v.added) lines.push('- State gained (' + key + '): ' + JournalMarkdown._inline(x));
      } else {
        lines.push('- State ' + key + ': ' + JournalMarkdown._inline(String(v.was)) + ' -> ' + JournalMarkdown._inline(String(v.now)));
      }
    }
    return lines.join('\n');
  }

  static _narrator_request(e) {
    const a = e.audit || {};
    const lines = ['### Narrator request', '',
      'Model ' + e.modelRef + ', temperature ' + e.temperature + ', window ' + (e.window || '?') + ' tokens. Estimated '
      + a.total + ' tokens (' + JournalMarkdown._share(a.total, e.window) + ' of the window).', '',
      '| Part | Tokens (est.) |', '| --- | ---: |'];
    for (const [name, n] of Object.entries(a.layers || {})) lines.push('| ' + name + ' | ' + n + ' |');
    lines.push('| history (' + (a.historyMessages || 0) + ' messages) | ' + (a.history || 0) + ' |');
    lines.push('| player text | ' + (a.user || 0) + ' |');
    lines.push('| scene notes | ' + (a.anchor || 0) + ' |');
    lines.push('');
    if (a.think) lines.push('Reasoning text left in the history: ' + a.think + ' tokens.', '');
    if ((a.duplicates || []).length) {
      lines.push('Repeated content (six-word phrases found in two parts):');
      for (const d of a.duplicates) lines.push('- ' + d.a + ' and ' + d.b + ': ' + d.words + ' shared phrases, e.g. "' + d.sample + '"');
      lines.push('');
    } else {
      lines.push('No repeated content between parts.', '');
    }
    const h = e.history || {};
    lines.push('History against the previous request: ' + (h.first ? 'first request of this log'
      : h.kept + ' kept, ' + h.added + ' new, ' + h.dropped + ' dropped from the front, ' + h.rewritten + ' rewritten'
        + (h.forkAt != null ? ', diverges at message ' + (h.forkAt + 1) + ' (a different branch)' : '')) + '.', '');
    if (e.extra && Object.keys(e.extra).length) lines.push('Request extras: `' + JSON.stringify(e.extra) + '`', '');
    for (const m of e.shown || []) {
      lines.push('**' + m.role + '**' + (m.note ? ' (' + m.note + ')' : ''), '', JournalMarkdown.FENCE + 'text', m.text, JournalMarkdown.FENCE, '');
    }
    return lines.join('\n');
  }

  static _reply(e) {
    const lines = ['### Reply `' + JournalMarkdown._id(e.messageId) + '`', '',
      (e.aborted ? 'Stopped before it finished. ' : '') + 'Tokens in/out as the server counted them: ' + (e.tokensIn == null ? '?' : e.tokensIn) + '/' + (e.tokensOut == null ? '?' : e.tokensOut)
      + '; ' + e.words + ' words.' + (e.error ? ' Error: ' + e.error + '.' : ''), ''];
    if (e.reasoning) lines.push('Reasoning:', '', JournalMarkdown.FENCE + 'text', e.reasoning, JournalMarkdown.FENCE, '');
    if (e.toolCalls) lines.push('Tool calls recorded on the reply:', '', JournalMarkdown.FENCE + 'json', JSON.stringify(e.toolCalls, null, 1), JournalMarkdown.FENCE, '');
    lines.push(JournalMarkdown.FENCE + 'text', e.content || '(empty)', JournalMarkdown.FENCE);
    if (e.tidied) lines.push('', 'Stored after tidying (headings and note labels removed):', '', JournalMarkdown.FENCE + 'text', e.tidied, JournalMarkdown.FENCE);
    return lines.join('\n');
  }

  static _side_call(e) {
    const lines = ['### Bookkeeping call: ' + e.kind, '',
      'For reply `' + JournalMarkdown._id(e.messageId) + '`, model ' + (e.modelRef || '(story model)') + ', ' + e.ms + ' ms, request about '
      + e.requestTokens + ' tokens' + (e.schema ? ', answer decoded under a JSON schema' : '') + (e.error ? '. FAILED: ' + e.error : '') + '.', ''];
    for (const m of e.shown || []) lines.push('**' + m.role + '**' + (m.note ? ' (' + m.note + ')' : ''), '', JournalMarkdown.FENCE + 'text', m.text, JournalMarkdown.FENCE, '');
    if (e.reasoning) lines.push('**reasoning**', '', JournalMarkdown.FENCE + 'text', e.reasoning, JournalMarkdown.FENCE, '');
    lines.push('**answer**', '', JournalMarkdown.FENCE + 'text', e.text || '(none)', JournalMarkdown.FENCE);
    return lines.join('\n');
  }

  static _state_changes(e) {
    const lines = ['### What reply `' + JournalMarkdown._id(e.messageId) + '` changed', ''];
    if (!(e.changes || []).length) lines.push('Nothing.');
    for (const c of e.changes || []) lines.push('- ' + c.kind + ': ' + JournalMarkdown._inline(c.text));
    lines.push('', 'Story is now at turn ' + e.state.turn + (e.state.scene ? ', at ' + e.state.scene : '') + ', cast ' + (e.state.cast.join(', ') || '(nobody)')
      + ', ' + e.state.ledger.length + ' ledger rows, ' + e.state.threads.length + ' open threads'
      + (e.state.pressure ? ', pressure: ' + JournalMarkdown._inline(e.state.pressure) : ', no pressure line') + '.');
    return lines.join('\n');
  }

  static _reaction_end(e) {
    const counts = {};
    for (const c of e.calls || []) {
      const key = c.kind + (c.ok ? '' : ' (no answer)');
      counts[key] = (counts[key] || 0) + 1;
    }
    const tally = Object.entries(counts).map(([k, n]) => k + ' x' + n).join(', ') || 'none';
    const lines = ['### Bookkeeping for `' + JournalMarkdown._id(e.messageId) + '` ' + e.status + (e.detail ? ': ' + JournalMarkdown._inline(e.detail) : '') + ' (' + e.ms + ' ms after the reply ended)',
      '', 'Calls made: ' + tally + '.'];
    if ((e.missing || []).length) lines.push('', '**MISSING: no answered ' + e.missing.join(', ') + ' call. Nothing was recorded for this reply.**');
    return lines.join('\n');
  }

  static _grounding(e) {
    const lines = ['### Knowledge base lookups', ''];
    const part = (label, g, extra) => {
      if (!g) return;
      if (!g.enabled) { lines.push('- ' + label + ': turned off for this story.'); return; }
      if (!g.available) { lines.push('- ' + label + ': NO KNOWLEDGE BASE ANSWERED, so no cards (' + g.ms + ' ms).'); return; }
      const total = (g.cast || []).reduce((n, c) => n + c.cards.length, 0);
      lines.push('- ' + label + ': ' + total + ' card(s) for ' + (g.cast || []).length + ' character(s) on stage, ' + g.ms + ' ms.' + (extra || ''));
      for (const c of g.cast || []) {
        const by = c.lookedUpBy !== undefined ? ' looked up by "' + JournalMarkdown._inline(c.lookedUpBy) + '"' : (c.condition ? ' (condition: ' + JournalMarkdown._inline(c.condition) + ')' : '');
        lines.push('  - ' + c.name + by + ': ' + (c.cards.map((k) => k.title + ' [' + k.id + ', ' + k.chars + ' chars]').join('; ') || 'no card'));
      }
    };
    part('Body notes', e.body);
    part('Up-close notes', e.surface, e.surface && e.surface.playerText ? ' Player text read: "' + JournalMarkdown._inline(e.surface.playerText).slice(0, 160) + '"' : '');
    return lines.join('\n');
  }

  static _time(at) {
    try { return new Date(at).toISOString().replace('T', ' ').slice(0, 19); } catch (_) { return String(at); }
  }

  static _id(id) {
    const s = String(id || 'none');
    return s.length > 10 ? s.slice(-7) : s;
  }

  static _inline(text) {
    return String(text === undefined || text === null ? '' : text).replace(/\s+/g, ' ').trim();
  }

  static _share(tokens, window) {
    const w = Number(window) || 0;
    return w > 0 ? Math.round((Number(tokens) || 0) / w * 100) + '%' : '?';
  }
}

module.exports = JournalMarkdown;
