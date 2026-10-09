const { webContents } = require('electron');

class ImageServerBroadcast {
  static CHANNEL = 'core.imageServer.serverEvent';

  static wire(runtimeServer) {
    runtimeServer.on('state-change', (e) => ImageServerBroadcast.send('state-change', e));
    runtimeServer.on('log', (e) => ImageServerBroadcast.send('log', e));
  }

  static send(type, payload) {
    for (const wc of webContents.getAllWebContents()) {
      try {
        if (!wc.isDestroyed()) wc.send(ImageServerBroadcast.CHANNEL, { type, payload });
      } catch (_) {}
    }
  }
}

module.exports = ImageServerBroadcast;
