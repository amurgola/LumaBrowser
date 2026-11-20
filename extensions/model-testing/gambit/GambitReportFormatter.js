class GambitReportFormatter {
  static FAILED_CHECKS_SHOWN = 4;
  static LABEL_WIDTH = 26;

  static format(report) {
    return [
      ...GambitReportFormatter._header(report.meta || {}),
      ...report.groups.map(GambitReportFormatter._groupLine),
      '',
      ...GambitReportFormatter._summary(report),
      ...GambitReportFormatter._failures(report.groups),
      '',
    ].join('\n');
  }

  static _header(meta) {
    const lines = ['', `Model compatibility gambit: ${meta.modelName || meta.modelPath || '(unknown model)'}`];
    if (meta.runtimeName) lines.push(`Runtime: ${meta.runtimeName}`);
    lines.push('');
    return lines;
  }

  static _groupLine(group) {
    const detail = group.derived ? group.detail : `${group.passed}/${group.n} tasks passed`;
    const pct = GambitReportFormatter._percent(group.score);
    return `  ${pct}  ${group.label.padEnd(GambitReportFormatter.LABEL_WIDTH)} ${detail}`;
  }

  static _summary(report) {
    const pct = GambitReportFormatter._percent;
    const coverage = report.coverage;
    const lines = [
      `  OVERALL ${pct(report.overall)}  (${report.band})   worst-decile ${pct(report.worstDecile)}`,
      `  Coverage: ${coverage.ran} of ${coverage.total} tasks ran` + (coverage.skipped ? `, ${coverage.skipped} skipped` : ''),
    ];
    for (const [reason, ids] of Object.entries(coverage.reasons || {})) {
      lines.push(`    skipped (${reason}): ${ids.join(', ')}`);
    }
    return lines;
  }

  static _failures(groups) {
    const failures = groups.flatMap((g) => (g.failures || []).map((f) => ({ group: g.label, ...f })));
    if (!failures.length) return [];
    const lines = ['', '  Failures:'];
    for (const failure of failures) {
      lines.push(`    ${failure.taskId} (${failure.group}) ${(failure.score * 100).toFixed(0)}%`);
      for (const check of failure.failedChecks.slice(0, GambitReportFormatter.FAILED_CHECKS_SHOWN)) {
        lines.push(`      - ${check.name}${check.detail ? ': ' + check.detail : ''}`);
      }
    }
    return lines;
  }

  static _percent(value) {
    return (value * 100).toFixed(1).padStart(5) + '%';
  }
}

module.exports = GambitReportFormatter;
