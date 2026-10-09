export default class SettingToggle {
  static wire(el, write, feedback, after) {
    if (!el) return;
    el.addEventListener('change', async () => {
      const next = el.checked;
      let result;
      try { result = await write(next); } catch (e) { result = { success: false, error: e.message }; }
      const ok = !result || result.success !== false;
      if (ok) {
        feedback.markSaved(el, true);
        if (typeof after === 'function') after(next, result);
        return;
      }
      el.checked = !next;
      feedback.markSaved(el, false, result.error || 'Could not save this setting');
      if (typeof after === 'function') after(!next, result);
    });
  }
}
