const StepKinds = require('./StepKinds');
const ParamTemplate = require('./ParamTemplate');

class EndpointSpec {
  static NAME_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
  static RETURN_KINDS = Object.freeze(['rows', 'object', 'value', 'text']);
  static STATUSES = Object.freeze(['draft', 'validated', 'broken']);

  static DEFAULT_POLICY = Object.freeze({
    attempts: 2,
    backoffMs: 1500,
    allowLlmFallback: true,
    stepTimeoutMs: 15000,
    recoveryTimeoutMs: 45000,
    totalTimeoutMs: 120000,
  });

  static POLICY_LIMITS = Object.freeze({
    attempts: [1, 5],
    backoffMs: [0, 60000],
    stepTimeoutMs: [1000, 120000],
    recoveryTimeoutMs: [0, 300000],
    totalTimeoutMs: [5000, 600000],
  });

  static normalize(input = {}) {
    const name = String(input.name || '').trim();
    if (!EndpointSpec.NAME_PATTERN.test(name)) {
      throw new Error(`Endpoint name must be snake_case letters, digits and underscores (got "${name}")`);
    }
    const params = EndpointSpec._params(input.params);
    const steps = EndpointSpec._steps(input.steps);
    EndpointSpec._checkPlaceholders(steps, params);
    return {
      name,
      description: String(input.description || '').trim(),
      params,
      steps,
      returns: EndpointSpec.normalizeReturns(input.returns, steps),
      policy: EndpointSpec.normalizePolicy(input.policy),
    };
  }

  static normalizeReturns(returns, steps = []) {
    const given = returns && typeof returns === 'object' ? returns : {};
    const kind = EndpointSpec.RETURN_KINDS.includes(given.kind) ? given.kind : EndpointSpec._inferReturnKind(steps);
    const out = { kind };
    if (Array.isArray(given.fields) && given.fields.length) out.fields = given.fields.map((f) => String(f));
    else if (kind === 'rows') {
      const inferred = EndpointSpec._inferFields(steps);
      if (inferred.length) out.fields = inferred;
    }
    if (given.description) out.description = String(given.description);
    return out;
  }

  static normalizePolicy(policy) {
    const given = policy && typeof policy === 'object' ? policy : {};
    const out = { ...EndpointSpec.DEFAULT_POLICY };
    for (const [key, [min, max]] of Object.entries(EndpointSpec.POLICY_LIMITS)) {
      if (given[key] === undefined) continue;
      const n = Number(given[key]);
      if (!Number.isFinite(n)) throw new Error(`policy.${key} must be a number`);
      out[key] = Math.min(max, Math.max(min, Math.round(n)));
    }
    if (given.allowLlmFallback !== undefined) out.allowLlmFallback = !!given.allowLlmFallback;
    return out;
  }

  static usesLlm(steps) {
    return (steps || []).some((step) => step.kind === 'llm_transform');
  }

  static _params(params) {
    if (params === undefined || params === null) return [];
    if (!Array.isArray(params)) throw new Error('params must be an array of { name, type, required, description }');
    const seen = new Set();
    return params.map((param, index) => {
      const normalized = ParamTemplate.normalizeParam(param, index);
      if (seen.has(normalized.name)) throw new Error(`Param "${normalized.name}" is declared twice`);
      seen.add(normalized.name);
      return normalized;
    });
  }

  static _steps(steps) {
    if (!Array.isArray(steps) || !steps.length) throw new Error('steps must be a non-empty array');
    return steps.map((step, index) => StepKinds.validate(step, index));
  }

  static _checkPlaceholders(steps, params) {
    const declared = new Set(params.map((p) => p.name));
    const used = ParamTemplate.referenced(steps);
    for (const name of used) {
      if (!declared.has(name)) throw new Error(`Steps use {{${name}}} but no param named "${name}" is declared`);
    }
  }

  static _inferReturnKind(steps) {
    const producers = steps.filter((step) => StepKinds.PRODUCERS.includes(step.kind));
    const last = producers[producers.length - 1];
    if (!last) return 'text';
    if (last.kind === 'extract' || last.kind === 'table') return 'rows';
    if (last.kind === 'read') return last.as === '$' ? 'value' : 'object';
    if (last.kind === 'transform') return last.op === 'first' ? 'object' : 'rows';
    return 'object';
  }

  static _inferFields(steps) {
    const extract = [...steps].reverse().find((step) => step.kind === 'extract');
    return extract ? Object.keys(extract.childSelectors) : [];
  }
}

module.exports = EndpointSpec;
