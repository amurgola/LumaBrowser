import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class AgentCard {
  static render(a, modelLabel, on) {
    const card = document.createElement('div');
    card.className = 'luma-card luma-card--center';
    card.innerHTML = AgentCard._mainHtml(a, modelLabel);
    card.appendChild(AgentCard._actions(a, on));
    return card;
  }

  static plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  static _mainHtml(a, modelLabel) {
    const esc = HtmlEscaper.escape;
    const toolCount = (a.tools && a.tools.length) || 0;
    const docCount = a.kbDocs || 0;
    return '<div class="luma-card-main">'
      + '<div class="luma-card-name">' + esc(a.name) + '</div>'
      + '<div class="luma-card-desc">' + esc(a.description || 'No description') + '</div>'
      + '<div class="am-card-meta">'
      + '<span class="luma-chip">' + esc(modelLabel) + '</span>'
      + '<span class="luma-chip">' + AgentCard.plural(toolCount, 'tool') + '</span>'
      + (docCount ? '<span class="luma-chip">' + AgentCard.plural(docCount, 'knowledge doc') + '</span>' : '')
      + '</div></div>';
  }

  static _actions(a, on) {
    const actions = document.createElement('div');
    actions.className = 'luma-card-actions';
    actions.appendChild(AgentCard._button('luma-btn', 'Edit', () => on.edit(a)));
    actions.appendChild(AgentCard._button('luma-btn', 'Export', () => on.exportAgent(a)));
    actions.appendChild(AgentCard._button('luma-btn danger', 'Delete', async () => {
      if (await Dialogs.confirm('Delete agent "' + a.name + '"?')) on.deleteAgent(a.id);
    }));
    return actions;
  }

  static _button(cls, label, onClick) {
    const btn = document.createElement('button');
    btn.className = cls;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }
}
