export default class PeerGpusHint {
  static async fill(api, doc) {
    if (!api || !api.getPeerGpus) return;
    try {
      const r = await api.getPeerGpus();
      const hint = doc.getElementById('peerGpusHint');
      if (!hint || !r || !r.success) return;
      hint.textContent = PeerGpusHint.text(r);
    } catch (_) {}
  }

  static text(r) {
    const gpus = (r.peers || []).flatMap((p) => (p.devices || []).map((d) => `${d.name} ${Math.round(d.vramTotalMB / 1024)} GB (${p.name})`));
    return gpus.length
      ? `Available now: ${gpus.join(', ')}${r.active ? ' (currently borrowed)' : ''}`
      : 'No peer GPUs attached yet.';
  }
}
