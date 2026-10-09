class StatusMapping {
  static PSEUDO_PREFIX = '~';

  static columnForStatus(columns, source, remoteStatus) {
    const list = Array.isArray(columns) ? columns : [];
    if (!list.length || !StatusMapping._norm(remoteStatus)) return null;
    return StatusMapping._fromLinks(list, source, remoteStatus)
      || StatusMapping._fromStatusMap(list, source, remoteStatus)
      || StatusMapping._byName(list, remoteStatus);
  }

  static columnKeyForStatus(columns, source, remoteStatus) {
    const column = StatusMapping.columnForStatus(columns, source, remoteStatus);
    return column ? column.key : StatusMapping.pseudoKey(remoteStatus);
  }

  static pseudoKey(status) {
    return `${StatusMapping.PSEUDO_PREFIX}${StatusMapping._norm(status)}`;
  }

  static isPseudo(columnKey) {
    return String(columnKey || '').startsWith(StatusMapping.PSEUDO_PREFIX);
  }

  static statusForColumn(columns, source, columnKey, listStatuses = null) {
    const mapped = StatusMapping._statusMap(source)[columnKey];
    if (!Array.isArray(listStatuses)) {
      if (mapped) return String(mapped);
      const column = (columns || []).find((c) => c.key === columnKey);
      return column ? column.title : String(columnKey || '');
    }
    const names = listStatuses.map((s) => (s && typeof s === 'object' ? s.status : s)).filter(Boolean);
    if (mapped) {
      const found = names.find((n) => StatusMapping.matches(n, mapped));
      if (found) return found;
    }
    const candidates = names.filter((n) => {
      const column = StatusMapping.columnForStatus(columns, source, n);
      return column && column.key === columnKey;
    });
    return candidates.length === 1 ? candidates[0] : null;
  }

  static link(config, status, columnKey) {
    const base = config || {};
    const statusColumns = { ...(base.statusColumns || {}), [StatusMapping._norm(status)]: columnKey };
    const statusLabels = { ...(base.statusLabels || {}), [StatusMapping._norm(status)]: String(status) };
    const statusMap = { ...(base.statusMap || {}) };
    for (const [key, value] of Object.entries(statusMap)) {
      if (key !== columnKey && StatusMapping.matches(value, status)) delete statusMap[key];
    }
    if (!statusMap[columnKey]) statusMap[columnKey] = String(status);
    return { ...base, statusColumns, statusLabels, statusMap };
  }

  static prune(config, columnKeys) {
    const keep = new Set(columnKeys);
    const base = config || {};
    const statusColumns = Object.fromEntries(Object.entries(base.statusColumns || {}).filter(([, key]) => keep.has(key)));
    const statusMap = Object.fromEntries(Object.entries(base.statusMap || {}).filter(([key]) => keep.has(key)));
    const statusLabels = Object.fromEntries(Object.entries(base.statusLabels || {}).filter(([status]) => statusColumns[status]));
    const changed = Object.keys(statusColumns).length !== Object.keys(base.statusColumns || {}).length
      || Object.keys(statusMap).length !== Object.keys(base.statusMap || {}).length;
    return changed ? { ...base, statusColumns, statusLabels, statusMap } : null;
  }

  static matches(a, b) {
    const left = StatusMapping._norm(a);
    return !!left && left === StatusMapping._norm(b);
  }

  static _fromLinks(columns, source, remoteStatus) {
    const config = source && source.config;
    const links = config && config.statusColumns && typeof config.statusColumns === 'object' ? config.statusColumns : {};
    const key = links[StatusMapping._norm(remoteStatus)];
    return key ? columns.find((c) => c.key === key) || null : null;
  }

  static _fromStatusMap(columns, source, remoteStatus) {
    for (const [columnKey, status] of Object.entries(StatusMapping._statusMap(source))) {
      if (!StatusMapping.matches(status, remoteStatus)) continue;
      const column = columns.find((c) => c.key === columnKey);
      if (column) return column;
    }
    return null;
  }

  static _byName(columns, remoteStatus) {
    return columns.find((c) => StatusMapping.matches(c.key, remoteStatus) || StatusMapping.matches(c.title, remoteStatus)) || null;
  }

  static _statusMap(source) {
    const config = source && source.config;
    return config && config.statusMap && typeof config.statusMap === 'object' ? config.statusMap : {};
  }

  static _norm(value) {
    return String(value == null ? '' : value).toLowerCase().replace(/[\s_-]+/g, '');
  }
}

module.exports = StatusMapping;
