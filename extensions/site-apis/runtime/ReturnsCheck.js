const Faults = require('../spec/Faults');
const Transforms = require('./Transforms');

class ReturnsCheck {
  static check(returns, result) {
    const kind = returns && returns.kind ? returns.kind : 'text';
    const problem = ReturnsCheck._problem(kind, returns, result);
    if (!problem) return null;
    return Faults.make(Faults.SHAPE_MISMATCH, `Expected ${kind} but got ${Transforms.describe(result)}: ${problem.message}`, {
      detail: { expected: kind, actual: Transforms.describe(result), ...(problem.detail || {}) },
    });
  }

  static _problem(kind, returns, result) {
    switch (kind) {
      case 'rows': return ReturnsCheck._rows(returns, result);
      case 'object': return Transforms.isObject(result) ? null : { message: 'the result is not an object' };
      case 'value': return ReturnsCheck._isScalar(result) ? null : { message: 'the result is not a single value' };
      case 'text': return typeof result === 'string' ? null : { message: 'the result is not text' };
      default: return null;
    }
  }

  static _rows(returns, result) {
    if (!Array.isArray(result)) return { message: 'the result is not a list' };
    if (!result.every(Transforms.isObject)) return { message: 'not every row is an object' };
    const fields = Array.isArray(returns.fields) ? returns.fields : [];
    if (!result.length || !fields.length) return null;
    const missing = fields.filter((field) => !result.some((row) => field in row));
    if (!missing.length) return null;
    return { message: `no row has the field(s) ${missing.join(', ')}`, detail: { missingFields: missing } };
  }

  static _isScalar(value) {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
  }
}

module.exports = ReturnsCheck;
