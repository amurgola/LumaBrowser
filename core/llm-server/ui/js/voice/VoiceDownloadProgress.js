export default class VoiceDownloadProgress {
  static listen(api, note, { accept = () => true, label }) {
    return api.voice.onVoiceEvent((evt) => {
      if (!evt || !accept(evt)) return;
      if (evt.type === 'download' && evt.payload && evt.payload.total) {
        note.textContent = 'Downloading ' + label(evt) + ': ' + Math.round((evt.payload.received / evt.payload.total) * 100) + '%';
      } else if (evt.type === 'extract') {
        note.textContent = 'Unpacking…';
      }
    });
  }
}
