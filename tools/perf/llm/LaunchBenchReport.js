class LaunchBenchReport {
  static COLUMNS = [
    ['variant', (r) => r.variant],
    ['load s', (r) => r.loadSeconds],
    ['VRAM MiB', (r) => LaunchBenchReport._mib(r.vramMib)],
    ['peak MiB', (r) => LaunchBenchReport._mib(r.peakVramMib)],
    ['decode tok/s', (r) => (r.decodeTps || []).join(' / ')],
    ['long tok/s', (r) => r.decodeLongTps],
    ['prompt tok/s', (r) => r.promptTps],
    ['depth tok/s', (r) => r.decodeAtDepthTps],
    ['cache', (r) => LaunchBenchReport.hitRate(r.cacheStats)],
    ['error', (r) => r.error],
  ];

  static line(r) {
    if (r.error) return `${r.variant}: ${r.error}`;
    return `${r.variant}: load ${r.loadSeconds}s, vram ${LaunchBenchReport._mib(r.vramMib)}, decode ${(r.decodeTps || []).join('/')}`
      + `${r.decodeLongTps != null ? ` long ${r.decodeLongTps}` : ''}, prompt ${r.promptTps} tok/s, depth ${r.decodeAtDepthTps}`
      + `${LaunchBenchReport.hitRate(r.cacheStats) ? `, cache ${LaunchBenchReport.hitRate(r.cacheStats)}` : ''}`;
  }

  static markdown(results, planned) {
    const head = LaunchBenchReport.COLUMNS.map(([name]) => name);
    const rows = results.map((r) => LaunchBenchReport.COLUMNS.map(([, get]) => LaunchBenchReport._cell(get(r))));
    return [
      '# Launch benchmark', '',
      'Planned argv: `' + (planned && planned.args ? planned.args.join(' ') : '') + '`', '',
      '| ' + head.join(' | ') + ' |',
      '|' + head.map(() => '---').join('|') + '|',
      ...rows.map((cells) => '| ' + cells.join(' | ') + ' |'),
      '',
      ...results.filter((r) => r.variant !== 'planned' || r.args).map((r) => `- ${r.variant}: \`${(r.args || []).join(' ')}\``),
      '',
      ...results.flatMap((r) => LaunchBenchReport.samples(r)),
    ].join('\n');
  }

  static samples(r) {
    const s = r.samples;
    if (!s || !s.phases || !Object.keys(s.phases).length) return [];
    const gpus = Array.from({ length: s.gpus || 0 }, (_, i) => i);
    const head = ['phase', 's', 'CPU %', 'RAM GB', ...gpus.flatMap((i) => [`gpu${i} SM %`, `gpu${i} FB GB`, `gpu${i} W`, `gpu${i} PCIe MB/s`])];
    const rows = Object.entries(s.phases).map(([phase, p]) => [
      phase, p.seconds, LaunchBenchReport._pair(p.cpuPct), LaunchBenchReport._pair(p.ramUsedMb, 1024),
      ...gpus.flatMap((i) => {
        const g = (p.gpus || [])[i] || {};
        return [LaunchBenchReport._pair(g.smPct), LaunchBenchReport._pair(g.fbMb, 1024), LaunchBenchReport._pair(g.powerW), LaunchBenchReport._pair(g.pcieMbs)];
      }),
    ]);
    return [
      `## ${r.variant} samples`, '',
      '| ' + head.join(' | ') + ' |',
      '|' + head.map(() => '---').join('|') + '|',
      ...rows.map((cells) => '| ' + cells.map(LaunchBenchReport._cell).join(' | ') + ' |'),
      '',
    ];
  }

  static _pair(stat, divide = 1) {
    if (!stat || stat.mean == null) return '';
    const f = (v) => (divide === 1 ? v : +(v / divide).toFixed(1));
    return `${f(stat.mean)} / ${f(stat.peak)}`;
  }

  static hitRate(lines) {
    for (const line of (lines || []).slice().reverse()) {
      const m = /ubatch <= 8:.*hit rate = ([\d.]+%)/.exec(line);
      if (m) return m[1];
    }
    return '';
  }

  static _mib(map) {
    if (!map) return '';
    return Object.keys(map).sort().map((k) => `${k} ${map[k]}`).join(', ');
  }

  static _cell(v) {
    return v == null ? '' : String(v).replace(/\|/g, '/');
  }
}

module.exports = LaunchBenchReport;
