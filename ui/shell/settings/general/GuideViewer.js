import GuideMarkdown from './GuideMarkdown.js';

export default class GuideViewer {
  constructor({ feedback }) {
    this._feedback = feedback;
  }

  async show(type) {
    const result = await window.electronAPI.getGuide(type);
    if (!result.success) { this._feedback.toast(result.error || 'Guide not found', 'bad'); return; }
    const overlay = document.createElement('div');
    overlay.className = 'gs-guide-modal';
    overlay.innerHTML = `<div class="gs-guide-content">
      <button class="gs-guide-close">Close</button>
      <div>${GuideMarkdown.render(result.content)}</div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.gs-guide-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }
}
