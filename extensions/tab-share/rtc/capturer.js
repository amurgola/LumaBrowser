(function () {
  'use strict';
  const bridge = window.tabShareRtc;
  if (!bridge) return;

  const MAX_BITRATE = 6_000_000;
  const MAX_FPS = 30;
  const MAX_W = 1920;
  const MAX_H = 1200;
  const streams = new Map();
  const peers = new Map();
  const goWaiters = new Map();

  const send = (msg) => bridge.send(msg);
  const log = (message) => send({ k: 'log', message });

  function getStream(tabId) {
    const have = streams.get(tabId);
    if (have) return have.pending;
    const pending = new Promise((resolve, reject) => {
      goWaiters.set(tabId, { resolve, reject });
      send({ k: 'capture-request', tabId });
    }).then(async () => {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: MAX_FPS, max: MAX_FPS }, width: { max: MAX_W }, height: { max: MAX_H } },
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      try { track.contentHint = 'detail'; } catch (_) {}
      try { await track.applyConstraints({ width: { max: MAX_W }, height: { max: MAX_H }, frameRate: { max: MAX_FPS } }); } catch (_) {}
      track.addEventListener('ended', () => release(tabId));
      send({ k: 'capture-done', tabId, ok: true });
      return stream;
    }).catch((err) => {
      streams.delete(tabId);
      send({ k: 'capture-done', tabId, ok: false, error: err && err.message });
      throw err;
    });
    streams.set(tabId, { stream: null, pending });
    pending.then((stream) => { const e = streams.get(tabId); if (e) e.stream = stream; }).catch(() => {});
    return pending;
  }

  async function createPeer({ peerId, tabId, iceServers }) {
    let stream;
    try { stream = await getStream(tabId); } catch (err) { send({ k: 'error', peerId, message: `capture failed: ${err && err.message}` }); return; }
    if (peers.has(peerId)) return;
    const pc = new RTCPeerConnection({ iceServers: iceServers || [] });
    peers.set(peerId, { pc, tabId });
    const track = stream.getVideoTracks()[0];
    const sender = pc.addTrack(track, stream);
    try {
      const p = sender.getParameters();
      p.encodings = [{ maxBitrate: MAX_BITRATE, maxFramerate: MAX_FPS }];
      p.degradationPreference = 'maintain-resolution';
      await sender.setParameters(p);
    } catch (_) {}
    pc.onicecandidate = (e) => { if (e.candidate) send({ k: 'cand', peerId, cand: e.candidate.toJSON() }); };
    pc.onconnectionstatechange = () => {
      send({ k: 'state', peerId, state: pc.connectionState });
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') closePeer(peerId);
    };
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ k: 'offer', peerId, sdp: pc.localDescription.sdp });
    } catch (err) {
      send({ k: 'error', peerId, message: `offer failed: ${err && err.message}` });
      closePeer(peerId);
    }
  }

  function closePeer(peerId) {
    const p = peers.get(peerId);
    if (!p) return;
    peers.delete(peerId);
    try { p.pc.close(); } catch (_) {}
  }

  function release(tabId) {
    for (const [id, p] of [...peers]) if (p.tabId === tabId) closePeer(id);
    const e = streams.get(tabId);
    streams.delete(tabId);
    if (e && e.stream) for (const t of e.stream.getTracks()) { try { t.stop(); } catch (_) {} }
  }

  bridge.on(async (msg) => {
    try {
      switch (msg.k) {
        case 'create': return createPeer(msg);
        case 'answer': {
          const p = peers.get(msg.peerId);
          if (p) await p.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp });
          return;
        }
        case 'cand': {
          const p = peers.get(msg.peerId);
          if (p && msg.cand) await p.pc.addIceCandidate(msg.cand).catch(() => {});
          return;
        }
        case 'close': return closePeer(msg.peerId);
        case 'release': return release(msg.tabId);
        case 'capture-go': { const w = goWaiters.get(msg.tabId); goWaiters.delete(msg.tabId); if (w) w.resolve(); return; }
        case 'capture-denied': { const w = goWaiters.get(msg.tabId); goWaiters.delete(msg.tabId); if (w) w.reject(new Error(msg.error || 'denied')); return; }
        default: return;
      }
    } catch (err) {
      log(`${msg && msg.k}: ${err && err.message}`);
    }
  });

  send({ k: 'ready' });
})();
