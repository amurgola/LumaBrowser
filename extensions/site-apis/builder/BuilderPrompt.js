const StepKinds = require('../spec/StepKinds');

class BuilderPrompt {
  static MEANINGS = Object.freeze({
    navigate: 'load url (placeholders URL-encoded), wait for load',
    click: 'click the element (text narrows selector matches)',
    type: 'type text into the element; submit presses Enter; clear defaults true',
    press_key: 'press key on the element or the page',
    select: 'choose option in a select or combobox',
    scroll: 'scroll the element or page: direction, amount, times',
    wait: 'wait for the element or text to be visible, hidden or present',
    settle: 'wait for the DOM to go quiet (after a navigation or submit)',
    read: 'one element\'s text (or attribute) into result[as]; as "$" makes it the whole result',
    extract: 'rows: selector is the repeating row, childSelectors maps field to a selector relative to the row',
    table: 'a table\'s rows keyed by header (rowSelector/cellSelector for non-table layouts)',
    transform: 'reshape the current result deterministically (see ops)',
    llm_transform: 'the LLM rewrites the current result per instruction (non-deterministic, last resort)',
  });

  static TRANSFORM_OPS = Object.freeze([
    'sort { by, order: asc|desc, numeric }',
    'filter { field, filterOp: ' + StepKinds.FILTER_OPS.join('|') + ', value }',
    'limit { count }',
    'pick { fields }',
    'first',
    'parse_number { fields } (strips currency symbols and thousands separators)',
    'rename { map: { old: new } }',
    'flatten { path }',
  ]);

  static build(o = {}) {
    const lines = ['<site_api_builder>'];
    if (!o.site) lines.push(...BuilderPrompt._unbound(o.persistedTabs));
    else lines.push(...BuilderPrompt._bound(o));
    lines.push('</site_api_builder>');
    return lines.join('\n');
  }

  static _unbound(persistedTabs) {
    const tabs = Array.isArray(persistedTabs) ? persistedTabs : [];
    return [
      'You build SITE APIs: named endpoints (parameters in, JSON out) recorded on one of the user\'s persisted,',
      'signed-in browser tabs. This conversation is NOT bound to a site yet.',
      '',
      'First ask the user which persisted tab (site) to build on. Call list_persisted_tabs to show the choices;',
      'then call use_tab with the chosen tabId. use_tab binds the conversation and the site; the work tab opens',
      'on the next turn, so after use_tab answers, END your reply and tell the user to continue.',
      'If no persisted tab exists, tell the user to open the site, sign in, and persist the tab from its tab',
      'menu, then come back.',
      ...(tabs.length ? ['', 'Persisted tabs right now:', ...tabs.map((t) => `- tabId ${t.tabId}: ${t.origin} (${t.title || 'no title'}) partition ${t.partition}`)] : []),
    ];
  }

  static _bound(o) {
    const site = o.site;
    const endpoints = Array.isArray(o.endpoints) ? o.endpoints : [];
    const current = o.currentEndpoint || null;
    return [
      `You build SITE APIs for ${site.name} (${site.origin}): named endpoints (parameters in, JSON out) that replay`,
      'a recorded step script in a hidden tab sharing the user\'s signed-in session, exposed as siteapi_* chat and',
      'MCP tools and REST routes. You are the builder: you talk with the user, demonstrate on the work tab, and',
      'turn the demonstration into a script with the builder tools.',
      '',
      ...BuilderPrompt._workTab(o.workTabId, site),
      '',
      'FLOW',
      '1. Login. Ask whether the site needs a sign-in and whether the work tab is signed in (look at the page).',
      '   The user signs in BY HAND in the persisted tab; the work tab shares that session. NEVER type credentials',
      '   or automate a login wall; if the work tab shows a sign-in page, tell the user to sign in in the persisted',
      '   tab and wait. Record the login rules with define_site (login.required, signInUrlPatterns, the selectors).',
      '2. Define. For each endpoint ask what it should do, its params (name, type, an EXAMPLE value each) and what',
      '   it returns. Call define_endpoint. That starts recording.',
      '3. Demonstrate. On the work tab, do the task once with the example values using the page tools:',
      '   navigate, click, type (submit true to press Enter), select_option, press_key, scroll, wait_for, and to',
      '   read the result extract_data (baseSelector = the repeating row, childSelectors = field selectors relative',
      '   to the row) for a list, or get_element for a single value. Use get_source (type clean) or observe_page to',
      '   find elements, but the recording keeps ONLY the arguments you pass: with EVERY click, type, press_key,',
      '   select_option, wait_for, get_element and extract_data pass a CSS selector (`selector`) AND a plain-language',
      '   `llmFallback` description of the element ("the search box at the top"). A ref number alone is not',
      '   recorded. Reads for your own eyes (observe_page, get_source, screenshot) are not recorded.',
      '4. Compile. As soon as the demonstration is done, in the same reply, call compile_endpoint. Read the',
      '   steps back. Fix them with set_steps when',
      '   needed: replace leftover literal example values with {{param}} placeholders, add a wait before an',
      '   extract when the page loads results late, add transform steps (parse_number then sort for "the lowest',
      '   price", limit, filter, pick), and give every targeted step both selector and description.',
      '5. Test. Call test_endpoint with the example params, then with a second set. Check ok and the data shape.',
      '   On a fault read the advice and the stepsLog, fix with set_steps, test again.',
      '6. Save. When a test answers ok with the expected shape, call save_endpoint and tell the user the tool',
      '   name. Then offer the next endpoint.',
      '',
      'STEP CATALOG (every step may carry selector, description, note, optional, timeoutMs; click, type, select,',
      'read, extract and table need a selector or a description, both preferred):',
      ...Object.entries(StepKinds.CATALOG).map(([kind, spec]) => BuilderPrompt._catalogLine(kind, spec)),
      'Transform ops: ' + BuilderPrompt.TRANSFORM_OPS.join('; ') + '.',
      'The current result: the last producer step (read, extract, table, transform, llm_transform) sets it; read',
      'with as other than "$" merges into an object; extract and table replace it with rows.',
      'Placeholders: {{name}} inside any step string is replaced by the param value at call time; {{name|url}}',
      'URL-encodes it, {{name|raw}} never does; a navigate url is URL-encoded by default. Every placeholder must',
      'name a declared param.',
      'returns: { kind: rows|object|value|text, fields?, description? }; for rows every declared field must appear',
      'on at least one row or the run faults with shape_mismatch.',
      '',
      'SITE',
      JSON.stringify(BuilderPrompt._siteJson(site)),
      ...BuilderPrompt._endpointsBlock(endpoints, current),
    ];
  }

  static _workTab(workTabId, site) {
    if (workTabId == null) {
      return ['No work tab could be opened in this turn (the browser is not available); define and edit steps, but tell the user demonstration needs the browser.'];
    }
    return [
      `WORK TAB: tab ${workTabId}, open in session partition ${site.partition} at ${site.startUrl}. All page tools`,
      'act on it by default; do not open other tabs. The user can watch it in the tab strip. The replay runner',
      'uses a separate hidden tab in the same partition, so what works here works there.',
    ];
  }

  static _catalogLine(kind, spec) {
    const fields = [...spec.required.map((f) => f), ...spec.optional.map((f) => `${f}?`)].join(', ');
    return `- ${kind}${fields ? ` { ${fields} }` : ''}: ${BuilderPrompt.MEANINGS[kind] || ''}`;
  }

  static _siteJson(site) {
    return { id: site.id, name: site.name, origin: site.origin, partition: site.partition, startUrl: site.startUrl, login: site.login, status: site.status, statusNote: site.statusNote || null };
  }

  static _endpointsBlock(endpoints, current) {
    const lines = [];
    if (!endpoints.length) lines.push('ENDPOINTS: none yet.');
    else {
      lines.push('ENDPOINTS:');
      for (const e of endpoints) {
        lines.push(JSON.stringify({ name: e.name, status: e.status, description: e.description, params: e.params, returns: e.returns, steps: e.steps ? e.steps.length : 0, toolName: e.toolName || undefined, lastRun: e.lastRun || null }));
      }
    }
    if (current) {
      lines.push('', `CURRENT ENDPOINT (${current.status}${current.recording ? ', recording' : ''}): ${current.name}`);
      lines.push(JSON.stringify({ description: current.description, params: current.params, returns: current.returns, steps: current.steps }));
      if (current.recording) lines.push('Recording is on: your page tool calls are part of its demonstration until compile_endpoint.');
    }
    return lines;
  }
}

module.exports = BuilderPrompt;
