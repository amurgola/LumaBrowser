class Transforms {
  static NUMBER_NOISE = /[^0-9.eE+-]/g;

  static apply(step, result) {
    const op = Transforms.OPS[step.op];
    if (!op) throw new Error(`Unknown transform op "${step.op}"`);
    return op(step, result);
  }

  static sort({ by, order = 'asc', numeric = false }, result) {
    const rows = Transforms._rows(result, 'sort');
    const direction = order === 'desc' ? -1 : 1;
    const key = numeric ? (row) => Transforms.toNumber(Transforms.get(row, by)) : (row) => Transforms.get(row, by);
    return [...rows].sort((a, b) => {
      const [ka, kb] = [key(a), key(b)];
      if (ka == null || kb == null) return Transforms._nullsLast(ka, kb);
      return direction * Transforms._compare(ka, kb);
    });
  }

  static filter({ field, filterOp = 'eq', value }, result) {
    const rows = Transforms._rows(result, 'filter');
    const test = Transforms.FILTERS[filterOp];
    if (!test) throw new Error(`Unknown filterOp "${filterOp}"`);
    return rows.filter((row) => test(Transforms.get(row, field), value));
  }

  static limit({ count }, result) {
    return Transforms._rows(result, 'limit').slice(0, Math.max(0, Number(count) || 0));
  }

  static pick({ fields }, result) {
    const names = Array.isArray(fields) ? fields.map(String) : [];
    if (Array.isArray(result)) return result.map((row) => Transforms._pickFrom(row, names));
    return Transforms._pickFrom(result, names);
  }

  static first(step, result) {
    const rows = Transforms._rows(result, 'first');
    return rows.length ? rows[0] : null;
  }

  static parseNumber({ fields }, result) {
    const names = Array.isArray(fields) ? fields.map(String) : [];
    const convert = (row) => {
      if (!Transforms.isObject(row)) return row;
      const out = { ...row };
      for (const name of names) if (name in out) out[name] = Transforms.toNumber(out[name]);
      return out;
    };
    return Array.isArray(result) ? result.map(convert) : convert(result);
  }

  static rename({ map }, result) {
    const pairs = Object.entries(map || {});
    const convert = (row) => {
      if (!Transforms.isObject(row)) return row;
      const out = { ...row };
      for (const [from, to] of pairs) {
        if (!(from in out)) continue;
        out[String(to)] = out[from];
        delete out[from];
      }
      return out;
    };
    return Array.isArray(result) ? result.map(convert) : convert(result);
  }

  static flatten({ path }, result) {
    if (Array.isArray(result)) return result.flatMap((row) => Transforms._listOf(Transforms.get(row, path)));
    return Transforms.get(result, path);
  }

  static OPS = Object.freeze({
    sort: Transforms.sort,
    filter: Transforms.filter,
    limit: Transforms.limit,
    pick: Transforms.pick,
    first: Transforms.first,
    parse_number: Transforms.parseNumber,
    rename: Transforms.rename,
    flatten: Transforms.flatten,
  });

  static FILTERS = Object.freeze({
    eq: (a, b) => Transforms._loose(a) === Transforms._loose(b),
    neq: (a, b) => Transforms._loose(a) !== Transforms._loose(b),
    contains: (a, b) => String(a == null ? '' : a).toLowerCase().includes(String(b).toLowerCase()),
    not_contains: (a, b) => !String(a == null ? '' : a).toLowerCase().includes(String(b).toLowerCase()),
    gt: (a, b) => Transforms.toNumber(a) > Transforms.toNumber(b),
    gte: (a, b) => Transforms.toNumber(a) >= Transforms.toNumber(b),
    lt: (a, b) => Transforms.toNumber(a) < Transforms.toNumber(b),
    lte: (a, b) => Transforms.toNumber(a) <= Transforms.toNumber(b),
    matches: (a, b) => new RegExp(String(b), 'i').test(String(a == null ? '' : a)),
    present: (a) => a !== null && a !== undefined && String(a).trim() !== '',
  });

  static get(value, path) {
    if (path == null || path === '') return value;
    return String(path).split('.').reduce((cur, key) => (cur != null && typeof cur === 'object' ? cur[key] : undefined), value);
  }

  static toNumber(value) {
    if (typeof value === 'number') return value;
    if (value == null) return null;
    const cleaned = String(value).replace(Transforms.NUMBER_NOISE, '');
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  static isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  static _rows(result, op) {
    if (!Array.isArray(result)) throw new Error(`transform ${op} needs rows (the current result is ${Transforms.describe(result)})`);
    return result;
  }

  static describe(value) {
    if (value === null || value === undefined) return 'empty';
    if (Array.isArray(value)) return `a list of ${value.length}`;
    return typeof value === 'object' ? 'an object' : `a ${typeof value}`;
  }

  static _pickFrom(row, names) {
    if (!Transforms.isObject(row)) return row;
    const out = {};
    for (const name of names) if (name in row) out[name] = row[name];
    return out;
  }

  static _listOf(value) {
    if (Array.isArray(value)) return value;
    return value === undefined ? [] : [value];
  }

  static _loose(value) {
    return value == null ? '' : String(value).trim().toLowerCase();
  }

  static _nullsLast(a, b) {
    if (a == null && b == null) return 0;
    return a == null ? 1 : -1;
  }

  static _compare(a, b) {
    if (a === b) return 0;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }
}

module.exports = Transforms;
