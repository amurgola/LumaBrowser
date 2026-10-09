import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class AgentPicker {
  static MODE_ID = 'agent-chat';
  static MARGIN = 8;

  static pick(agents) {
    return new Promise((resolve) => {
      const pop = AgentPicker._popover(agents);
      document.body.appendChild(pop);
      AgentPicker._position(pop);
      AgentPicker._wire(pop, agents, resolve);
    });
  }

  static _popover(agents) {
    const pop = document.createElement('div');
    pop.className = 'cm-model-pop';
    pop.style.position = 'fixed';
    pop.style.bottom = 'auto';
    pop.style.right = 'auto';
    pop.innerHTML = '<div class="cm-model-group">Chat with agent</div>' + agents.map(AgentPicker._option).join('');
    pop.setAttribute('data-cm-overlay', '');
    return pop;
  }

  static _option(a) {
    const esc = HtmlEscaper.escape;
    return '<div class="cm-model-opt" data-agent="' + esc(a.id) + '"><div>'
      + esc(a.name)
      + (a.kbDocs ? ' <span class="cm-model-sub">' + a.kbDocs + ' knowledge doc' + (a.kbDocs === 1 ? '' : 's') + '</span>' : '')
      + (a.description ? '<div class="cm-model-sub">' + esc(a.description) + '</div>' : '')
      + '</div></div>';
  }

  static _position(pop) {
    const anchor = document.querySelector('.cm-side-mode[data-mode="' + AgentPicker.MODE_ID + '"]')
      || document.querySelector('.cm-chip-mode[data-mode="' + AgentPicker.MODE_ID + '"]');
    const r = anchor && anchor.getBoundingClientRect();
    if (!r) {
      pop.style.left = '50%';
      pop.style.top = '30%';
      pop.style.transform = 'translateX(-50%)';
      return;
    }
    const m = AgentPicker.MARGIN;
    pop.style.left = Math.max(m, Math.min(r.left, window.innerWidth - pop.offsetWidth - m)) + 'px';
    pop.style.top = Math.max(m, Math.min(r.bottom + 6, window.innerHeight - pop.offsetHeight - m)) + 'px';
  }

  static _wire(pop, agents, resolve) {
    const close = (value) => {
      document.removeEventListener('mousedown', onDoc, true);
      document.removeEventListener('keydown', onKey, true);
      pop.remove();
      resolve(value);
    };
    const onDoc = (e) => { if (!pop.contains(e.target)) close(null); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    pop.addEventListener('click', (e) => {
      const opt = e.target.closest('[data-agent]');
      if (opt) close(agents.find((a) => a.id === opt.dataset.agent) || null);
    });
    setTimeout(() => {
      document.addEventListener('mousedown', onDoc, true);
      document.addEventListener('keydown', onKey, true);
    }, 0);
  }
}
