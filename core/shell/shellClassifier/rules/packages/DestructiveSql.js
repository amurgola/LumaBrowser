class DestructiveSql {
  static CHECKS = Object.freeze([
    { label: null, pattern: /\bdrop\s+(materialized\s+view|database|schema|keyspace|table|view|index|collection|sequence|function|procedure|trigger|user|role)\b/i },
    { label: 'TRUNCATE', pattern: /\btruncate\s+(table\s+)?[\w."`[]/i },
    { label: 'ALTER TABLE ... DROP', pattern: /\balter\s+table\s+\S+\s+drop\b/i },
    { label: 'DELETE without WHERE', unfiltered: /\bdelete\s+from\b/i },
    { label: 'UPDATE without WHERE', unfiltered: /\bupdate\s+\S+\s+set\b/i },
    { label: 'dropDatabase()', pattern: /\.dropdatabase\s*\(/i },
    { label: 'drop()', pattern: /\.drop\s*\(\s*\)/i },
    { label: 'an empty-filter delete', pattern: /\.(deletemany|remove)\s*\(\s*\{\s*\}\s*\)/i },
  ]);

  static find(text) {
    for (const statement of DestructiveSql._statements(text)) {
      const label = DestructiveSql._labelFor(statement);
      if (label) return label;
    }
    return null;
  }

  static _statements(text) {
    return String(text || '').split(';').map((statement) => statement.trim()).filter(Boolean);
  }

  static _labelFor(statement) {
    for (const check of DestructiveSql.CHECKS) {
      const label = check.pattern ? DestructiveSql._patternLabel(check, statement) : DestructiveSql._unfilteredLabel(check, statement);
      if (label) return label;
    }
    return null;
  }

  static _patternLabel({ label, pattern }, statement) {
    const match = pattern.exec(statement);
    if (!match) return null;
    return label || match[0].replace(/\s+/g, ' ').toUpperCase();
  }

  static _unfilteredLabel({ label, unfiltered }, statement) {
    return unfiltered.test(statement) && !/\bwhere\b/i.test(statement) ? label : null;
  }
}

module.exports = DestructiveSql;
