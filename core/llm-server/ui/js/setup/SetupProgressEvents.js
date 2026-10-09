import ByteFormatter from '../format/ByteFormatter.js';
import TransferText from '../format/TransferText.js';

export default class SetupProgressEvents {
  static VERIFYING = 'Verifying the download…';

  static EXTRACTING = 'Extracting…';

  static INSTALLING = 'Installing…';

  static runtimeListener(hooks, options = {}) {
    return (e) => {
      if (!e) return;
      if (e.type === 'download' && e.payload && e.payload.total) {
        const prefix = options.companionPrefix && e.payload.kind === 'companion' ? 'Companion · ' : '';
        hooks.setBar(e.payload.received / e.payload.total, prefix + SetupProgressEvents._sizeLine(e.payload));
      } else if (e.type === 'extract') {
        SetupProgressEvents._extract(hooks, e, options.installPhase);
      }
    };
  }

  static modelListener(hooks, extra) {
    return (e) => {
      if (!e) return;
      if (extra && extra(e)) return;
      if (e.type === 'download' && e.payload) {
        const { received, total } = e.payload;
        hooks.setBar(total ? received / total : null, TransferText.downloadSubText(e.payload), e.payload);
      } else if (e.type === 'verify') {
        SetupProgressEvents._verify(hooks, e.payload || {});
      }
    };
  }

  static _sizeLine(payload) {
    return ByteFormatter.gb(payload.received) + ' / ' + ByteFormatter.gb(payload.total);
  }

  static _extract(hooks, e, installPhase) {
    if (!installPhase) {
      hooks.setBar(null, SetupProgressEvents.EXTRACTING);
      return;
    }
    hooks.setBar(null, SetupProgressEvents.INSTALLING);
    if (e.payload && e.payload.label) hooks.sub(e.payload.label);
  }

  static _verify(hooks, payload) {
    hooks.setBar(payload.total > 0 ? (payload.read || 0) / payload.total : null, SetupProgressEvents.VERIFYING);
  }
}
