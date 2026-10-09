export default class LiteModelPicker {
  static render(select, models, selectedRef) {
    if (!select) return;
    select.textContent = '';
    if (!models.length) {
      select.appendChild(LiteModelPicker._option('', 'No model configured', false));
      select.disabled = true;
      return;
    }
    select.disabled = false;
    for (const m of models) select.appendChild(LiteModelPicker._option(m.ref, m.label || m.ref, m.ref === selectedRef));
  }

  static _option(value, text, selected) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = text;
    if (selected) opt.selected = true;
    return opt;
  }
}
