export default class DashboardMode {
  static EDIT_SUB = 'Drag live modules and extension widgets from the dock and arrange them. Layout saves automatically.';
  static EDIT_HINT = 'Drag a live module or an extension widget (such as the Hub\'s board) from the dock onto the grid. Build new modules in the chat with "make me a widget that..."';
  static LIVE_HINT = 'Click Edit to add live modules and extension widgets to your dashboard.';

  constructor({ doc, grid, refreshDock }) {
    this._doc = doc;
    this._grid = grid;
    this._refreshDock = refreshDock;
    this._edit = false;
  }

  isEdit() {
    return this._edit;
  }

  set(edit) {
    this._edit = !!edit;
    this._doc.getElementById('dbRoot').classList.toggle('db-edit', this._edit);
    this._paintDockAndSlider();
    this._paintSubtitle();
    this._grid.setStatic(!this._edit);
    if (this._edit) this._refreshDock();
    this.syncEmpty();
  }

  syncEmpty() {
    const empty = this._doc.getElementById('dbEmpty');
    if (empty && this._grid.isReady()) empty.hidden = !this._grid.isEmpty();
    const hint = this._doc.getElementById('dbEmptyHint');
    if (hint) hint.textContent = this._edit ? DashboardMode.EDIT_HINT : DashboardMode.LIVE_HINT;
  }

  _paintDockAndSlider() {
    const dock = this._doc.getElementById('dbDock');
    if (dock) dock.hidden = !this._edit;
    this._doc.querySelectorAll('#dbModeSlider button').forEach((b) => {
      b.classList.toggle('active', (b.dataset.mode === 'edit') === this._edit);
    });
  }

  _paintSubtitle() {
    const sub = this._doc.getElementById('dbSub');
    if (!sub) return;
    sub.textContent = this._edit ? DashboardMode.EDIT_SUB : '';
    sub.hidden = !this._edit;
  }
}
