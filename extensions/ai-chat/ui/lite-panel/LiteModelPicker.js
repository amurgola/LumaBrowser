export default class LiteModelPicker {
  constructor(button, onPick) {
    this.button = button;
    this.onPick = onPick;
    this.models = [];
    this.selectedRef = null;
    this.pop = document.createElement('div');
    this.pop.className = 'ai-chat-model-pop';
    this.pop.hidden = true;
    this.pop.innerHTML = `<input class="ai-chat-model-search" type="search" placeholder="Search models..."
      role="combobox" aria-label="Search models" aria-autocomplete="list" aria-expanded="false"
      aria-controls="aiChatModelOptions" autocomplete="off">
      <div id="aiChatModelOptions" class="ai-chat-model-options" role="listbox" aria-label="Models"></div>
      <div class="ai-chat-model-count" role="status" aria-live="polite"></div>`;
    button.after(this.pop);
    this.input = this.pop.querySelector('input');
    this.list = this.pop.querySelector('[role="listbox"]');
    this.count = this.pop.querySelector('[role="status"]');
    this._toggle = () => this.pop.hidden ? this.open() : this.close();
    this._outside = (e) => { if (!this.pop.contains(e.target) && !button.contains(e.target)) this.close(); };
    this._resize = () => this.close();
    this._blur = (e) => { if (!this.pop.contains(e.relatedTarget)) this.close(); };
    button.addEventListener('click', this._toggle);
    this.input.addEventListener('input', () => this._filter());
    this.input.addEventListener('keydown', (e) => this._key(e));
    this.pop.addEventListener('focusout', this._blur);
    document.addEventListener('pointerdown', this._outside);
    window.addEventListener('resize', this._resize);
  }

  render(models, selectedRef) {
    this.models = models;
    this.selectedRef = models.some((m) => m.ref === selectedRef) ? selectedRef : (models[0]?.ref || null);
    const selected = models.find((m) => m.ref === this.selectedRef);
    this.button.textContent = selected ? (selected.label || selected.ref) : 'No model configured';
    this.button.title = this.button.textContent;
    this.button.disabled = !models.length;
    if (!this.pop.hidden) {
      if (!models.length) this.close();
      else this._filter();
    }
  }

  open() {
    if (!this.models.length) return;
    this.pop.hidden = false;
    this.button.setAttribute('aria-expanded', 'true');
    this.input.setAttribute('aria-expanded', 'true');
    this.input.value = '';
    this._filter();
    const rect = this.button.getBoundingClientRect();
    const width = Math.min(420, window.innerWidth - 16);
    this.pop.style.width = `${width}px`;
    this.pop.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const upward = below < 240 && above > below;
    this.pop.style.maxHeight = `${Math.max(80, Math.min(360, upward ? above : below))}px`;
    this.pop.style.top = upward ? 'auto' : `${rect.bottom + 6}px`;
    this.pop.style.bottom = upward ? `${window.innerHeight - rect.top + 6}px` : 'auto';
    this.input.focus();
  }

  close(restoreFocus = false) {
    this.pop.hidden = true;
    this.button.setAttribute('aria-expanded', 'false');
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    if (restoreFocus) this.button.focus();
  }

  destroy() {
    this.button.removeEventListener('click', this._toggle);
    document.removeEventListener('pointerdown', this._outside);
    window.removeEventListener('resize', this._resize);
    this.pop.remove();
  }

  _filter() {
    const terms = this.input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    this.filtered = this.models.filter((m) => terms.every((term) => `${m.label || ''} ${m.ref}`.toLowerCase().includes(term)));
    this.list.replaceChildren();
    this.filtered.forEach((model, i) => {
      const option = document.createElement('div');
      option.id = `aiChatModelOption-${i}`;
      option.className = 'ai-chat-model-option';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(model.ref === this.selectedRef));
      option.textContent = model.label || model.ref;
      option.addEventListener('pointerdown', (e) => e.preventDefault());
      option.addEventListener('click', () => this._pick(i));
      this.list.appendChild(option);
    });
    this.count.textContent = this.filtered.length ? `${this.filtered.length} of ${this.models.length} models` : 'No matching models';
    const selected = this.filtered.findIndex((m) => m.ref === this.selectedRef);
    this._activate(this.filtered.length ? Math.max(0, selected) : -1);
  }

  _activate(index) {
    this.active = index;
    Array.from(this.list.children).forEach((el, i) => el.classList.toggle('active', i === index));
    const option = this.list.children[index];
    if (option) {
      this.input.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView?.({ block: 'nearest' });
    } else this.input.removeAttribute('aria-activedescendant');
  }

  _key(e) {
    if (e.isComposing) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.close(true);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      if (this.filtered.length) this._activate((this.active + step + this.filtered.length) % this.filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this._pick(this.active);
    } else if (e.key === 'Tab') this.close();
  }

  _pick(index) {
    const model = this.filtered[index];
    if (!model) return;
    this.render(this.models, model.ref);
    this.close(true);
    this.onPick(model.ref);
  }
}
