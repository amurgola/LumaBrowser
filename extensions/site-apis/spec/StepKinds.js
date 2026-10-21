class StepKinds {
  static TARGETED = Object.freeze(['click', 'type', 'select', 'read', 'extract', 'table']);

  static OPTIONAL_TARGET = Object.freeze(['press_key', 'scroll', 'wait']);

  static PRODUCERS = Object.freeze(['read', 'extract', 'table', 'transform', 'llm_transform']);

  static TRANSFORM_OPS = Object.freeze(['sort', 'filter', 'limit', 'pick', 'first', 'parse_number', 'rename', 'flatten']);
  static FILTER_OPS = Object.freeze(['eq', 'neq', 'contains', 'not_contains', 'gt', 'gte', 'lt', 'lte', 'matches', 'present']);
  static WAIT_STATES = Object.freeze(['visible', 'hidden', 'present']);
  static SCROLL_DIRECTIONS = Object.freeze(['down', 'up', 'bottom', 'top']);

  static CATALOG = Object.freeze({
    navigate: { required: ['url'], optional: ['waitMs'] },
    click: { required: [], optional: ['text'] },
    type: { required: ['text'], optional: ['submit', 'clear'] },
    press_key: { required: ['key'], optional: [] },
    select: { required: ['option'], optional: [] },
    scroll: { required: [], optional: ['direction', 'amount', 'times'] },
    wait: { required: [], optional: ['text', 'state', 'timeoutMs'] },
    settle: { required: [], optional: ['quietMs', 'maxMs'] },
    read: { required: ['as'], optional: ['attribute', 'all'] },
    extract: { required: ['childSelectors'], optional: ['as', 'maxRows', 'preferTableStructure'] },
    table: { required: [], optional: ['as', 'rowSelector', 'cellSelector'] },
    transform: { required: ['op'], optional: ['by', 'order', 'numeric', 'field', 'value', 'count', 'fields', 'map', 'path'] },
    llm_transform: { required: ['instruction'], optional: ['returns'] },
  });

  static KINDS = Object.freeze(Object.keys(StepKinds.CATALOG));

  static isTargeted(kind) {
    return StepKinds.TARGETED.includes(kind);
  }

  static mayTarget(kind) {
    return StepKinds.TARGETED.includes(kind) || StepKinds.OPTIONAL_TARGET.includes(kind);
  }

  static validate(step, index) {
    const label = `Step ${index + 1}`;
    if (!step || typeof step !== 'object') throw new Error(`${label}: must be an object with a "kind"`);
    const spec = StepKinds.CATALOG[step.kind];
    if (!spec) throw new Error(`${label}: unknown kind "${step.kind}" (one of ${StepKinds.KINDS.join(', ')})`);
    for (const field of spec.required) {
      if (step[field] === undefined || step[field] === null || step[field] === '') throw new Error(`${label} (${step.kind}): "${field}" is required`);
    }
    StepKinds._validateTarget(step, label);
    StepKinds._validateFields(step, label);
    return StepKinds._normalize(step);
  }

  static _validateTarget(step, label) {
    const hasSelector = typeof step.selector === 'string' && step.selector.trim().length > 0;
    const hasDescription = typeof step.description === 'string' && step.description.trim().length > 0;
    if (StepKinds.isTargeted(step.kind) && !hasSelector && !hasDescription) {
      throw new Error(`${label} (${step.kind}): needs a "selector", a "description" of the element, or both`);
    }
    if (step.kind === 'extract' && !hasSelector && !hasDescription) {
      throw new Error(`${label} (extract): needs a row "selector" (the repeating element) or a "description" of the rows`);
    }
  }

  static _validateFields(step, label) {
    if (step.kind === 'transform') {
      if (!StepKinds.TRANSFORM_OPS.includes(step.op)) throw new Error(`${label} (transform): op must be one of ${StepKinds.TRANSFORM_OPS.join(', ')}`);
      if (step.op === 'sort' && !step.by) throw new Error(`${label} (transform sort): "by" names the field to sort on`);
      if (step.op === 'filter') {
        if (!step.field) throw new Error(`${label} (transform filter): "field" is required`);
        if (step.value === undefined && step.op !== 'present') throw new Error(`${label} (transform filter): "value" is required`);
        if (step.filterOp && !StepKinds.FILTER_OPS.includes(step.filterOp)) throw new Error(`${label} (transform filter): filterOp must be one of ${StepKinds.FILTER_OPS.join(', ')}`);
      }
      if (step.op === 'limit' && !(Number(step.count) > 0)) throw new Error(`${label} (transform limit): "count" must be a positive number`);
      if ((step.op === 'pick' || step.op === 'parse_number') && !Array.isArray(step.fields)) throw new Error(`${label} (transform ${step.op}): "fields" must be an array`);
      if (step.op === 'rename' && (!step.map || typeof step.map !== 'object')) throw new Error(`${label} (transform rename): "map" is { oldName: newName }`);
    }
    if (step.kind === 'extract' && (typeof step.childSelectors !== 'object' || !Object.keys(step.childSelectors).length)) {
      throw new Error(`${label} (extract): "childSelectors" maps field names to selectors relative to each row`);
    }
    if (step.kind === 'wait' && step.state && !StepKinds.WAIT_STATES.includes(step.state)) {
      throw new Error(`${label} (wait): state must be one of ${StepKinds.WAIT_STATES.join(', ')}`);
    }
    if (step.kind === 'scroll' && step.direction && !StepKinds.SCROLL_DIRECTIONS.includes(step.direction)) {
      throw new Error(`${label} (scroll): direction must be one of ${StepKinds.SCROLL_DIRECTIONS.join(', ')}`);
    }
    if (step.kind === 'read' && !/^[a-zA-Z_$][a-zA-Z0-9_]*$/.test(String(step.as))) {
      throw new Error(`${label} (read): "as" is the result field name (or "$" for the whole result)`);
    }
  }

  static _normalize(step) {
    const spec = StepKinds.CATALOG[step.kind];
    const keep = ['kind', 'selector', 'description', 'note', 'optional', 'timeoutMs', ...spec.required, ...spec.optional];
    if (step.kind === 'transform') keep.push('filterOp');
    const out = {};
    for (const field of keep) {
      if (step[field] === undefined) continue;
      const value = typeof step[field] === 'string' ? step[field].trim() : step[field];
      if ((field === 'selector' || field === 'description') && value === '') continue;
      out[field] = value;
    }
    return out;
  }
}

module.exports = StepKinds;
