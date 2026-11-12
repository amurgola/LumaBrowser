class CrashReproReport {
  static hex(code) {
    if (typeof code !== 'number' || (code >= 0 && code < 256)) return '';
    const u = code < 0 ? code >>> 0 : code;
    return ` (0x${u.toString(16).toUpperCase()})`;
  }

  static header(o, { userData, traceDir }) {
    return [
      `crash-repro: ${o.runs} launch(es), hold ${o.holdMs} ms each, pause ${o.pauseMs} ms, ${o.interact ? 'with' : 'without'} synthetic input, ${o.drive ? 'with' : 'without'} REST tab churn, ${o.stopOnCrash ? 'stop on first reproduction' : 'continue after reproductions'}`,
      `  userData:  ${userData}`,
      `  trace dir: ${traceDir}`,
      `  output:    ${o.outDir}\n`,
    ];
  }

  static runLine(r) {
    const secs = (r.durationMs / 1000).toFixed(1);
    return `${r.verdict} pid=${r.pid} exit=${r.code}${CrashReproReport.hex(r.code)}${r.signal ? ` signal=${r.signal}` : ''} after ${secs}s`;
  }

  static reproductionLines(r) {
    return [
      `    last event: ${r.lastEvent}`,
      `    trace log:  ${r.traceLog || '(not found)'} (END line: ${r.ended ? 'yes' : 'NO'})`,
      `    minidumps:  ${r.dumps.length ? r.dumps.join(', ') : 'none'}`,
      `    artifacts:  ${r.runDir}`,
    ];
  }

  static summaryLines(results) {
    const crashes = results.filter((r) => r.verdict !== 'clean');
    const lines = [`\n${results.length} launch(es): ${results.length - crashes.length} clean, ${crashes.length} reproduced`];
    for (const r of crashes) {
      lines.push(`  run ${r.index}: ${r.verdict} exit=${r.code}${CrashReproReport.hex(r.code)} at ${(r.durationMs / 1000).toFixed(1)}s: ${r.runDir}`);
    }
    return lines;
  }
}

module.exports = CrashReproReport;
