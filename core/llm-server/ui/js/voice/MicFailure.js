export default class MicFailure {
  static message(err) {
    const name = (err && err.name) || '';
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No microphone was found. Plug one in and reopen this panel.';
    if (name === 'NotReadableError' || name === 'AbortError') return 'The microphone could not be opened: another app may be using it.';
    if (name === 'NotAllowedError') return 'Microphone access was denied.';
    return 'Microphone error: ' + ((err && err.message) || name || 'unknown');
  }

  static async explain(api, err, note) {
    let msg = MicFailure.message(err);
    try {
      if (api.voice.micAccessStatus && await MicFailure._osBlocked(api)) {
        msg = 'Your operating system is blocking microphone access for this app. '
          + 'Allow it under microphone privacy settings, then try again.';
        MicFailure._addPrivacyButton(api, note);
      }
    } catch (_) {}
    if (note) note.textContent = msg;
  }

  static async _osBlocked(api) {
    const s = await api.voice.micAccessStatus();
    return !!(s && s.success && (s.status === 'denied' || s.status === 'restricted'));
  }

  static _addPrivacyButton(api, note) {
    if (!api.voice.openMicPrivacySettings || !note || !note.isConnected || note.parentElement.querySelector('.cm-voice-privacy')) return;
    const button = document.createElement('button');
    button.className = 'cm-voice-install cm-voice-privacy';
    button.type = 'button';
    button.textContent = 'Open microphone privacy settings';
    button.addEventListener('click', () => api.voice.openMicPrivacySettings());
    note.parentElement.insertBefore(button, note);
  }
}
