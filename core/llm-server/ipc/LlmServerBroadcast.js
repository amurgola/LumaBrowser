const electron = require('electron');

class LlmServerBroadcast {
  static SERVER_EVENT_CHANNEL = 'core.llmServer.serverEvent';
  static ARTIFACT_DATA_CHANNEL = 'core.llmServer.artifactData.changed';

  static wire(runtimeServer) {
    runtimeServer.on('state-change', (e) => LlmServerBroadcast.toAll(LlmServerBroadcast.SERVER_EVENT_CHANNEL, { type: 'state-change', payload: e }));
    runtimeServer.on('log', (e) => LlmServerBroadcast.toAll(LlmServerBroadcast.SERVER_EVENT_CHANNEL, { type: 'log', payload: e }));
  }

  static relayArtifactData(artifactDataStore) {
    artifactDataStore.on('change', ({ rootId, rev, keys }) =>
      LlmServerBroadcast.toAll(LlmServerBroadcast.ARTIFACT_DATA_CHANNEL, { rootId, rev, keys }));
  }

  static toAll(channel, message) {
    for (const wc of LlmServerBroadcast._allWebContents()) {
      try {
        if (!wc.isDestroyed()) wc.send(channel, message);
      } catch (_) {}
    }
  }

  static _allWebContents() {
    const webContents = electron && electron.webContents;
    return webContents && typeof webContents.getAllWebContents === 'function' ? webContents.getAllWebContents() : [];
  }
}

module.exports = LlmServerBroadcast;
