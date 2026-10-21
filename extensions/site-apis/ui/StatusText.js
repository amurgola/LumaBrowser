import TimeText from '../../ui-kit/ui/TimeText.js';

export default class StatusText {
  static SITE_PILLS = Object.freeze({
    ok: { cls: 'ok', label: 'Signed in' },
    signed_out: { cls: 'bad', label: 'Signed out' },
    unknown: { cls: 'muted', label: 'Unknown' },
  });

  static ENDPOINT_PILLS = Object.freeze({
    validated: { cls: 'ok', label: 'validated' },
    draft: { cls: 'muted', label: 'draft' },
    broken: { cls: 'bad', label: 'broken' },
  });

  static sitePill(site) {
    const pill = StatusText.SITE_PILLS[site && site.status] || StatusText.SITE_PILLS.unknown;
    return { ...pill, title: (site && site.statusNote) || pill.label };
  }

  static endpointPill(status) {
    return StatusText.ENDPOINT_PILLS[status] || StatusText.ENDPOINT_PILLS.draft;
  }

  static lastRun(lastRun) {
    if (!lastRun || !lastRun.at) return 'never run';
    const when = TimeText.formatRelative(lastRun.at);
    const duration = lastRun.durationMs != null ? ` (${StatusText.duration(lastRun.durationMs)})` : '';
    if (lastRun.ok) return `ok ${when}${duration}`;
    const code = lastRun.fault && lastRun.fault.code ? ` ${lastRun.fault.code}` : '';
    return `fault${code} ${when}${duration}`;
  }

  static params(params) {
    if (!Array.isArray(params) || !params.length) return 'no params';
    return params.map((p) => {
      const bits = [p.type || 'string'];
      if (p.required) bits.push('required');
      else if (p.default !== undefined) bits.push(`default ${p.default}`);
      return `${p.name} (${bits.join(', ')})`;
    }).join(', ');
  }

  static duration(ms) {
    const n = Number(ms);
    if (!Number.isFinite(n)) return '';
    if (n < 1000) return `${Math.round(n)}ms`;
    if (n < 60000) return `${(n / 1000).toFixed(1)}s`;
    return `${(n / 60000).toFixed(1)}m`;
  }

  static fault(fault, advice) {
    if (!fault) return advice || 'The run failed.';
    const step = fault.step != null ? ` at step ${fault.step + 1}` : '';
    const text = `${fault.code || 'fault'}${step}: ${fault.message || ''}`.trim();
    return advice ? `${text} ${advice}` : text;
  }

  static summary(sites) {
    const list = Array.isArray(sites) ? sites : [];
    if (!list.length) return 'No site APIs yet.';
    const endpoints = list.flatMap((s) => s.endpoints || []);
    const validated = endpoints.filter((e) => e.status === 'validated').length;
    return `${StatusText._count(list.length, 'site')}, ${StatusText._count(endpoints.length, 'endpoint')}, ${validated} validated.`;
  }

  static _count(n, noun) {
    return `${n} ${noun}${n === 1 ? '' : 's'}`;
  }
}
