export default class TableSort {
  constructor(ctx) {
    this._ctx = ctx;
  }

  onClick(e) {
    const th = e.target.closest && e.target.closest('.cm-asst-body table th');
    if (!th) return;
    const table = th.closest('table');
    const body = table && table.tBodies[0];
    if (!body || body.rows.length < 2) return;
    const col = Array.prototype.indexOf.call(th.parentElement.children, th);
    const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
    table.querySelectorAll('th[aria-sort]').forEach((h) => h.removeAttribute('aria-sort'));
    th.setAttribute('aria-sort', dir);
    TableSort.sortRows(body, col, dir === 'ascending' ? 1 : -1);
  }

  static sortRows(body, col, sign) {
    const rows = [...body.rows];
    const cell = (r) => ((r.cells[col] && r.cells[col].textContent) || '').trim();
    const nums = rows.map((r) => TableSort.number(cell(r)));
    const numeric = nums.some((n) => n !== null) && rows.every((r, i) => nums[i] !== null || cell(r) === '');
    const keyed = rows.map((r, i) => ({ r, i, n: nums[i], s: cell(r) }));
    keyed.sort((a, b) => {
      let d;
      if (numeric) d = (a.n === null ? Infinity : a.n) - (b.n === null ? Infinity : b.n);
      else d = a.s.localeCompare(b.s, undefined, { numeric: true, sensitivity: 'base' });
      return d ? d * sign : a.i - b.i;
    });
    for (const k of keyed) body.appendChild(k.r);
  }

  static number(text) {
    const t = String(text).replace(/[,\s]/g, '').replace(/^([-+−]?)[$€£¥]/, '$1').replace(/[%$€£¥]$/, '');
    if (!/^[-+−]?\d*\.?\d+(e[-+]?\d+)?$/i.test(t)) return null;
    return parseFloat(t.replace('−', '-'));
  }
}
