class ChildSelectorWarning {
  static NTH_CLASS_MISUSE = /\.[^\s>+~]+:nth-of-type\(/;

  static compose(result, childSelectors) {
    const parts = [
      ...ChildSelectorWarning._duplicates(result.duplicateFieldGroups),
      ...ChildSelectorWarning._nulls(result.nullFields, childSelectors),
      ...ChildSelectorWarning._constants(result.constantFields),
    ];
    return parts.length > 0 ? parts.join('; ') : null;
  }

  static _duplicates(groups) {
    if (!Array.isArray(groups)) return [];
    return groups.map((g) => `${g.join(', ')} resolve to the same element in every row; treat them as one field`);
  }

  static _nulls(fields, childSelectors) {
    if (!Array.isArray(fields) || fields.length === 0) return [];
    let message = `${fields.join(', ')} matched nothing in any row; the childSelector is likely wrong`;
    const misuse = fields.some((f) => ChildSelectorWarning.NTH_CLASS_MISUSE.test((childSelectors && childSelectors[f]) || ''));
    if (misuse) message += ' (:nth-of-type counts tag position among all siblings, not position within a class)';
    return [message];
  }

  static _constants(constants) {
    if (!Array.isArray(constants)) return [];
    return constants.map((c) => `${c.field} returns the same value ("${c.value}") in every row; the selector likely points at a static label, not the row's data`);
  }
}

module.exports = ChildSelectorWarning;
