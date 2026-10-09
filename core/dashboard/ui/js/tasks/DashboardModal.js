import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';

export default class DashboardModal {
  constructor(doc) {
    this._doc = doc;
    this._overlay = null;
  }

  open(title, bodyEl) {
    this.close();
    const box = this._doc.createElement('div');
    box.className = 'db-modal';
    box.appendChild(this._head(title));
    box.appendChild(bodyEl);
    this._overlay = this._doc.createElement('div');
    this._overlay.className = 'db-overlay';
    this._overlay.appendChild(box);
    this._overlay.addEventListener('click', (e) => { if (e.target === this._overlay) this.close(); });
    this._doc.body.appendChild(this._overlay);
  }

  close() {
    if (!this._overlay) return;
    this._overlay.remove();
    this._overlay = null;
  }

  isOpen() {
    return !!this._overlay;
  }

  _head(title) {
    const head = this._doc.createElement('div');
    head.className = 'db-modal-head';
    head.innerHTML = '<h2>' + HtmlEscaper.escape(title) + '</h2>';
    const closeBtn = this._doc.createElement('button');
    closeBtn.className = 'db-ghost';
    closeBtn.type = 'button';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => this.close());
    head.appendChild(closeBtn);
    return head;
  }
}
