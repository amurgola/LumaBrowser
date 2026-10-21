const RunFault = require('./RunFault');
const Transforms = require('./Transforms');

class StepReaders {
  static WHOLE = '$';
  static FORM_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];
  static NO_ROWS_NOTE = 'the row selector matched nothing; answered an empty list';

  constructor({ browser, tabId, targeted }) {
    this._browser = browser;
    this._tabId = tabId;
    this._targeted = targeted;
  }

  async read(step, index) {
    const primary = async (selector) => this._runScript(StepReaders.readScript(selector, step.attribute || null));
    const { result, via, recoveryMs } = await this._targeted(step, index, 'find', primary);
    const values = (result.data && result.data.values) || [];
    return { value: step.all ? values : values[0], via, recoveryMs };
  }

  async extract(step, index) {
    const primary = async (selector) => {
      const reply = await this._browser.extractData(this._tabId, {
        baseSelector: selector, childSelectors: step.childSelectors, preferTableStructure: !!step.preferTableStructure,
      });
      if (reply && reply.success && !(reply.rowCount > 0) && step.description) {
        return { success: false, zeroRows: true, error: 'the row selector matched no rows' };
      }
      return reply;
    };
    const outcome = await this._extractOutcome(step, index, primary);
    const rows = Array.isArray(outcome.rows) ? outcome.rows : [];
    const fields = Object.keys(step.childSelectors || {});
    const nullFields = outcome.nullFields || [];
    if (rows.length && fields.length && nullFields.length >= fields.length) {
      throw RunFault.step(index, `extract: every field is null in all ${rows.length} rows`, { nullFields });
    }
    const limit = Number(step.maxRows);
    return { rows: limit > 0 ? rows.slice(0, limit) : rows, via: outcome.via, note: outcome.note || null, recoveryMs: outcome.recoveryMs == null ? null : outcome.recoveryMs };
  }

  async table(step, index) {
    const primary = (selector) => this._browser.getTable(this._tabId, {
      selector, rowSelector: step.rowSelector || undefined, cellSelector: step.cellSelector || undefined,
    });
    const { result, via, recoveryMs } = await this._targeted(step, index, 'find', primary);
    const data = result.data || {};
    const headers = (data.headers || []).map((header, i) => (String(header || '').trim() || `col${i + 1}`));
    const rows = (data.rows || []).map((cells) => Object.fromEntries(headers.map((header, i) => [header, cells[i] === undefined ? null : cells[i]])));
    return { rows, via, recoveryMs };
  }

  static merge(current, as, value) {
    if (!as || as === StepReaders.WHOLE) return value;
    const base = Transforms.isObject(current) ? current : {};
    return { ...base, [as]: value };
  }

  static readScript(selector, attribute) {
    return `(function() {
  try {
    const els = Array.from(document.querySelectorAll(${JSON.stringify(selector || '')}));
    if (!els.length) return { success: false, error: 'No elements found' };
    const attr = ${JSON.stringify(attribute)};
    const forms = ${JSON.stringify(StepReaders.FORM_TAGS)};
    const pick = (el) => {
      if (attr) return el.getAttribute(attr);
      if (forms.includes(el.tagName)) return el.value;
      return (el.innerText != null ? el.innerText : el.textContent || '').trim();
    };
    return { success: true, values: els.map(pick), count: els.length };
  } catch (e) { return { success: false, error: e.message }; }
})();`;
  }

  async _extractOutcome(step, index, primary) {
    let caught = null;
    try {
      const { result, via, recoveryMs } = await this._targeted(step, index, 'find', primary);
      return { rows: result.data, nullFields: result.nullFields, via, recoveryMs };
    } catch (err) {
      caught = err;
    }
    const detail = caught instanceof RunFault ? caught.fault.detail : null;
    if (detail && detail.zeroRows) return { rows: [], nullFields: [], via: 'primary', note: StepReaders.NO_ROWS_NOTE };
    throw caught;
  }

  async _runScript(script) {
    const reply = await this._browser.executeJs(this._tabId, script);
    if (!reply || !reply.success) return { success: false, error: (reply && reply.error) || 'script failed' };
    const inner = reply.data ? reply.data.result : null;
    if (!inner || !inner.success) return { success: false, error: (inner && inner.error) || 'No elements found' };
    return { success: true, data: inner };
  }
}

module.exports = StepReaders;
