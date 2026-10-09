import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import OverflowMenu from '../../ui-kit/ui/OverflowMenu.js';

export default class MonitorRowActions {
  constructor(invoke, reload, hooks) {
    this._invoke = invoke;
    this._reload = reload;
    this._hooks = hooks;
  }

  async check(id, btn) {
    if (btn) { btn.disabled = true; btn.textContent = 'Checking'; }
    try {
      await this._invoke('checkNow', id);
    } catch (err) {
      console.error('page-change-detector: check failed:', err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Check'; }
      await this._reload();
    }
  }

  openMenu(anchor, m) {
    OverflowMenu.open(anchor, this._menuItems(m));
  }

  async toggle(m) {
    try {
      await this._invoke('update', m.id, { enabled: !m.enabled });
      await this._reload();
    } catch (err) {
      console.error('page-change-detector: pause/resume failed:', err);
    }
  }

  async remove(m) {
    const ok = await Dialogs.confirm(`Delete monitor "${m.name}" and all of its history?`, { okLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      const result = await this._invoke('delete', m.id);
      if (!result.success) return;
      this._hooks.onDeleted(m.id);
      await this._reload();
    } catch (err) {
      console.error('page-change-detector: delete failed:', err);
    }
  }

  async pick(m) {
    try {
      const result = await this._invoke('pickElements', m.id);
      if (!result.success) {
        await Dialogs.alert(`The element picker could not start: ${result.error || 'unknown error'}`);
        return;
      }
      if (result.cancelled) return;
      await this._reload();
      const n = Array.isArray(result.selectors) ? result.selectors.length : 0;
      if (n === 0) await Dialogs.alert('No elements were selected, so this monitor watches the whole page.');
    } catch (err) {
      console.error('page-change-detector: pick failed:', err);
    }
  }

  async clearSelectors(m) {
    const ok = await Dialogs.confirm(`Stop watching the picked elements on "${m.name}" and compare the whole page instead?`);
    if (!ok) return;
    try {
      const result = await this._invoke('clearSelectors', m.id);
      if (result.success) await this._reload();
    } catch (err) {
      console.error('page-change-detector: clear selectors failed:', err);
    }
  }

  _menuItems(m) {
    const selCount = Array.isArray(m.selectors) ? m.selectors.length : 0;
    const items = [
      { label: selCount > 0 ? 'Refine picked elements' : 'Pick elements to watch', onClick: () => this.pick(m) },
    ];
    if (selCount > 0) items.push({ label: 'Watch the whole page', onClick: () => this.clearSelectors(m) });
    items.push(
      { label: m.enabled ? 'Pause' : 'Resume', onClick: () => this.toggle(m) },
      { label: 'Edit', onClick: () => this._hooks.onEdit(m) },
      { label: 'Full history', onClick: () => this._hooks.onFullHistory(m.id) },
      { sep: true },
      { label: 'Delete', danger: true, onClick: () => this.remove(m) },
    );
    return items;
  }
}
