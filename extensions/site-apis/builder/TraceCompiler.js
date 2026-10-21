const EndpointSpec = require('../spec/EndpointSpec');
const StepKinds = require('../spec/StepKinds');

class TraceCompiler {
  static MIN_PLACEHOLDER_CHARS = 3;
  static MAX_FIELD_NAME_CHARS = 30;
  static DEFAULT_CHILD_SELECTORS = Object.freeze({ text: ':scope' });

  static IGNORED = new Set([
    'observe_page', 'get_source', 'screenshot', 'get_tabs', 'create_tab', 'close_tab', 'activate_tab',
    'get_console', 'get_network', 'search_knowledge_base', 'activate_tools', 'ask_user_takeover',
  ]);

  static LITERAL_FIELDS = new Set(['kind', 'as', 'state', 'direction', 'op', 'by', 'order', 'fields', 'map', 'path', 'field', 'filterOp']);

  static DIRECTIONS = new Set(StepKinds.SCROLL_DIRECTIONS);

  static compile(calls, options = {}) {
    const warnings = [];
    const dropped = [];
    let steps = [];
    let used = 0;
    for (const call of Array.isArray(calls) ? calls : []) {
      const outcome = TraceCompiler._compileCall(call, warnings);
      if (outcome.dropped) { if (outcome.dropped !== 'ignored') dropped.push({ tool: call.tool, reason: outcome.dropped }); continue; }
      used += 1;
      steps.push(...outcome.steps);
    }
    if (options.startUrl && (!steps.length || steps[0].kind !== 'navigate')) {
      steps.unshift({ kind: 'navigate', url: String(options.startUrl) }, { kind: 'settle' });
    }
    steps = TraceCompiler.placeholders(steps, TraceCompiler.exampleValues(options.params, options.examples));
    return { steps, warnings, dropped, used };
  }

  static validate(definition) {
    try {
      EndpointSpec.normalize(definition);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  static exampleValues(params, examples) {
    const values = {};
    for (const param of Array.isArray(params) ? params : []) {
      if (!param || !param.name) continue;
      if (param.example !== undefined && param.example !== null) values[param.name] = param.example;
      else if (param.default !== undefined && param.default !== null) values[param.name] = param.default;
    }
    for (const [name, value] of Object.entries(examples && typeof examples === 'object' ? examples : {})) {
      if (value !== undefined && value !== null) values[name] = value;
    }
    return values;
  }

  static placeholders(steps, values) {
    const entries = Object.entries(values || {})
      .map(([name, value]) => ({ name, value: String(value) }))
      .filter((e) => e.value.length >= TraceCompiler.MIN_PLACEHOLDER_CHARS)
      .sort((a, b) => b.value.length - a.value.length);
    if (!entries.length) return steps;
    return steps.map((step) => TraceCompiler._substituteStep(step, entries));
  }

  static _substituteStep(step, entries) {
    const out = {};
    for (const [field, value] of Object.entries(step)) {
      if (TraceCompiler.LITERAL_FIELDS.has(field)) { out[field] = value; continue; }
      out[field] = TraceCompiler._substituteValue(value, entries, step.kind === 'navigate' && field === 'url');
    }
    return out;
  }

  static _substituteValue(value, entries, encoded) {
    if (typeof value === 'string') return TraceCompiler._substituteString(value, entries, encoded);
    if (Array.isArray(value)) return value.map((item) => TraceCompiler._substituteValue(item, entries, encoded));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = TraceCompiler._substituteValue(v, entries, encoded);
      return out;
    }
    return value;
  }

  static _substituteString(text, entries, encoded) {
    let out = text;
    for (const { name, value } of entries) {
      const forms = [value];
      if (encoded) {
        const enc = encodeURIComponent(value);
        if (enc !== value) forms.push(enc, enc.replace(/%20/g, '+'));
      }
      for (const form of forms) out = out.split(form).join(`{{${name}}}`);
    }
    return out;
  }

  static _compileCall(call, warnings) {
    if (!call || !call.tool) return { dropped: 'ignored' };
    if (TraceCompiler.IGNORED.has(call.tool)) return { dropped: 'ignored' };
    if (!TraceCompiler._succeeded(call)) return { dropped: 'the call failed' };
    const params = call.params || {};
    const result = call.result || {};
    switch (call.tool) {
      case 'navigate': return TraceCompiler._navigate(params);
      case 'click': return TraceCompiler._click(params, result, warnings);
      case 'locate': return params.click === true ? TraceCompiler._locateClick(params) : { dropped: 'locate without click changes nothing' };
      case 'click_at': return { dropped: 'click_at has no selector; use click with a selector or locate with a description' };
      case 'type': return TraceCompiler._type(params, result, warnings);
      case 'fill_form': return TraceCompiler._fillForm(params, warnings);
      case 'press_key': return TraceCompiler._withTarget({ kind: 'press_key', key: params.key }, params);
      case 'select_option': return TraceCompiler._withTarget({ kind: 'select', option: params.option }, params, warnings);
      case 'set_date': return TraceCompiler._withTarget({ kind: 'type', text: params.date, clear: true }, params, warnings);
      case 'set_slider': return { dropped: 'set_slider has no step kind yet' };
      case 'scroll': return TraceCompiler._scroll(params);
      case 'wait_for': return TraceCompiler._wait(params);
      case 'get_element': return TraceCompiler._withTarget({ kind: 'read', as: TraceCompiler.fieldName(params.llmFallback || params.description || params.as) }, params, warnings);
      case 'extract_data': return TraceCompiler._extract(params.baseSelector, params.childSelectors, params, warnings);
      case 'collect_list': return TraceCompiler._extract(params.itemSelector, params.childSelectors, params, warnings, params.maxItems);
      case 'get_table': return TraceCompiler._table(params);
      default: return { dropped: `${call.tool} is not a page action` };
    }
  }

  static _succeeded(call) {
    if (call.success === false) return false;
    if (call.status && call.status !== 'ok') return false;
    if (call.result && call.result.success === false) return false;
    return true;
  }

  static _navigate(params) {
    if (!params.url) return { dropped: 'navigate without a url' };
    return { steps: [{ kind: 'navigate', url: String(params.url) }, { kind: 'settle' }] };
  }

  static _click(params, result, warnings) {
    const step = { kind: 'click' };
    if (params.text) step.text = String(params.text);
    const outcome = TraceCompiler._withTarget(step, params, warnings, result);
    if (outcome.steps && (result.urlChanged || (result.data && result.data.urlChanged))) outcome.steps.push({ kind: 'settle' });
    return outcome;
  }

  static _locateClick(params) {
    if (!params.description) return { dropped: 'locate without a description' };
    return { steps: [{ kind: 'click', description: String(params.description) }, { kind: 'settle' }] };
  }

  static _type(params, result, warnings) {
    if (params.text === undefined || params.text === null || params.text === '') return { dropped: 'type without text' };
    const step = { kind: 'type', text: String(params.text) };
    if (params.submit === true) step.submit = true;
    if (params.clear === false) step.clear = false;
    const outcome = TraceCompiler._withTarget(step, params, warnings, result);
    if (outcome.steps && (params.submit === true || result.urlChanged)) outcome.steps.push({ kind: 'settle' });
    return outcome;
  }

  static _fillForm(params, warnings) {
    const fields = Array.isArray(params.fields) ? params.fields : [];
    const steps = [];
    for (const field of fields) {
      if (!field || field.value === undefined) continue;
      const outcome = TraceCompiler._withTarget({ kind: 'type', text: String(field.value) }, field, warnings);
      if (outcome.steps) steps.push(...outcome.steps);
    }
    return steps.length ? { steps } : { dropped: 'fill_form without usable fields' };
  }

  static _scroll(params) {
    const step = { kind: 'scroll' };
    if (params.direction && TraceCompiler.DIRECTIONS.has(params.direction)) step.direction = params.direction;
    if (Number.isFinite(Number(params.amount))) step.amount = Number(params.amount);
    if (params.selector) step.selector = String(params.selector);
    return { steps: [step] };
  }

  static _wait(params) {
    const step = { kind: 'wait' };
    if (params.selector) step.selector = String(params.selector);
    if (params.llmFallback) step.description = String(params.llmFallback);
    if (params.text) step.text = String(params.text);
    if (params.state && StepKinds.WAIT_STATES.includes(params.state)) step.state = params.state;
    if (Number.isFinite(Number(params.timeout))) step.timeoutMs = Number(params.timeout);
    if (!step.selector && !step.description && !step.text) return { dropped: 'wait_for without a selector, description or text' };
    return { steps: [step] };
  }

  static _extract(selector, childSelectors, params, warnings, maxRows) {
    const step = { kind: 'extract' };
    const hasChildren = childSelectors && typeof childSelectors === 'object' && Object.keys(childSelectors).length > 0;
    step.childSelectors = hasChildren ? { ...childSelectors } : { ...TraceCompiler.DEFAULT_CHILD_SELECTORS };
    if (!hasChildren) warnings.push('an extract step had no childSelectors; it reads each row\'s text as "text", add field selectors with set_steps');
    if (Number.isFinite(Number(maxRows))) step.maxRows = Number(maxRows);
    return TraceCompiler._withTarget(step, { ...params, selector }, warnings);
  }

  static _table(params) {
    const step = { kind: 'table' };
    if (params.selector) step.selector = String(params.selector);
    if (params.llmFallback) step.description = String(params.llmFallback);
    if (params.rowSelector) step.rowSelector = String(params.rowSelector);
    if (params.cellSelector) step.cellSelector = String(params.cellSelector);
    if (!step.selector && !step.description) step.selector = 'table';
    return { steps: [step] };
  }

  static _withTarget(step, params, warnings = [], result = {}) {
    const selector = params.selector || result.resolvedSelector || (result.data && result.data.selector) || null;
    const description = params.llmFallback || params.description
      || (result.element && result.element.text ? `the "${String(result.element.text).trim()}" element` : null)
      || (params.text && step.kind === 'click' ? `the "${params.text}" element` : null);
    if (selector) step.selector = String(selector);
    if (description) step.description = String(description);
    if (!step.selector && !step.description) {
      if (!StepKinds.isTargeted(step.kind)) return { steps: [step] };
      const ref = params.ref != null ? ` (observe_page ref ${params.ref})` : '';
      step.description = `UNKNOWN ELEMENT${ref}: replace with a description of the element`;
      warnings.push(`a ${step.kind} step was recorded without a selector or description${ref}; describe it with set_steps`);
    }
    return { steps: [step] };
  }

  static fieldName(text) {
    const words = String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
      .filter((w) => w && !['the', 'a', 'an', 'of', 'in', 'on', 'at', 'for', 'to', 'element', 'value', 'field', 'text', 'this', 'that', 'page', 'shown'].includes(w));
    let name = words.join('_').slice(0, TraceCompiler.MAX_FIELD_NAME_CHARS).replace(/_+$/, '');
    if (!name) return 'value';
    if (!/^[a-z_]/.test(name)) name = `v_${name}`;
    return name;
  }
}

module.exports = TraceCompiler;
