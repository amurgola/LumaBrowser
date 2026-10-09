export default class MusicInstallProgress {
  static next(previous, type, payload) {
    if (type === 'start') return { phase: 'starting' };
    if (type === 'resolved') return { phase: 'resolved' };
    if (type === 'download') return { phase: 'download', received: payload && payload.received, total: payload && payload.total };
    if (type === 'extract') {
      return {
        phase: payload && payload.phase === 'done' ? 'extracted' : 'installing',
        label: (payload && payload.label) || (previous && previous.label) || null,
      };
    }
    if (type === 'error') return { phase: 'failed', error: (payload && payload.message) || 'install failed' };
    if (type === 'finalize') return null;
    return previous;
  }

  static isTerminal(type) {
    return type === 'error' || type === 'finalize';
  }
}
