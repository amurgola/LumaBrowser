import Dialogs from '../../../../core/llm-server/ui/js/dialogs/Dialogs.js';

export default class RestartNotes {
  constructor({ feedback }) {
    this._feedback = feedback;
  }

  install() {
    document.querySelectorAll('.gs-restart-note').forEach((note) => {
      if (note.querySelector('[data-gs-relaunch]')) return;
      note.appendChild(this._restartLink());
    });
  }

  static hideAll() {
    document.querySelectorAll('.gs-restart-note').forEach((n) => n.classList.remove('visible'));
  }

  static show(id) {
    document.getElementById(id).classList.add('visible');
  }

  _restartLink() {
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'luma-btn link gs-inline-link';
    link.setAttribute('data-gs-relaunch', '1');
    link.textContent = 'Restart now';
    link.style.marginLeft = '6px';
    link.addEventListener('click', () => this._relaunch());
    return link;
  }

  async _relaunch() {
    const ok = await Dialogs.confirm('Restart LumaBrowser now? Open tabs are restored on relaunch.', { okLabel: 'Restart' });
    if (!ok) return;
    try { await window.ipcBridge.invoke('core.settings.relaunch'); }
    catch (e) { this._feedback.toast(`Could not restart: ${e.message}`, 'bad'); }
  }
}
