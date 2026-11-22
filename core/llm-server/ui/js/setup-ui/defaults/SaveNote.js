export default class SaveNote {
  static SHOW_MS = 4000;

  static SAVED_TEXT = 'Saved.';

  static STOPPED_TEXT = 'Saved. The running model was stopped so the new settings can apply; it relaunches automatically on your next chat message.';

  constructor(doc, { noteId, bodyId, pillId }) {
    this._doc = doc;
    this._noteId = noteId;
    this._bodyId = bodyId;
    this._pillId = pillId;
    this._timer = null;
  }

  show(serverStopped) {
    const body = this._doc.getElementById(this._bodyId);
    if (!body) return;
    this._clear();
    const note = this._note(serverStopped);
    if (serverStopped) { body.prepend(note); return; }
    const pill = this._doc.getElementById(this._pillId);
    if (pill) pill.before(note); else body.prepend(note);
    this._timer = setTimeout(() => { note.remove(); this._timer = null; }, SaveNote.SHOW_MS);
  }

  _clear() {
    const old = this._doc.getElementById(this._noteId);
    if (old) old.remove();
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }

  _note(serverStopped) {
    const note = this._doc.createElement('div');
    note.id = this._noteId;
    note.className = serverStopped ? 'defaults-save-note stopped' : 'defaults-saved';
    note.setAttribute('role', 'status');
    note.textContent = serverStopped ? SaveNote.STOPPED_TEXT : SaveNote.SAVED_TEXT;
    return note;
  }
}
