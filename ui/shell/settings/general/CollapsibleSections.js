export default class CollapsibleSections {
  static keyFor(section) {
    return `gs.expanded.${section}`;
  }

  install() {
    document.querySelectorAll('.gs-collapsible-header[data-gs-section]').forEach((header) => this._wire(header));
  }

  _wire(header) {
    const section = header.dataset.gsSection;
    const body = document.querySelector(`.gs-collapsible-body[data-gs-body="${section}"]`);
    if (!body) return;
    const key = CollapsibleSections.keyFor(section);
    const apply = (open) => {
      header.classList.toggle('expanded', open);
      body.classList.toggle('visible', open);
    };
    let open = false;
    try { open = localStorage.getItem(key) === '1'; } catch (_) {}
    apply(open);
    header.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest('button, a, input')) return;
      open = !header.classList.contains('expanded');
      apply(open);
      try { localStorage.setItem(key, open ? '1' : '0'); } catch (_) {}
    });
  }
}
