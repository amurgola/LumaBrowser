import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class AgentForm {
  static BLANK = { name: '', description: '', systemPrompt: '', modelRef: null, tools: [] };

  static render(view, on) {
    const form = document.createElement('form');
    form.className = 'luma-form';
    form.innerHTML = AgentForm._html(view);
    form.querySelector('[data-cancel]').addEventListener('click', on.cancel);
    form.addEventListener('submit', (e) => { e.preventDefault(); on.submit(form); });
    return form;
  }

  static collect(form) {
    const value = (name) => form.querySelector(`[name=${name}]`).value;
    const name = value('name').trim();
    if (!name) return { error: 'Name is required.' };
    return {
      patch: {
        name,
        description: value('description').trim(),
        systemPrompt: value('systemPrompt'),
        modelRef: value('modelRef') || null,
        tools: Array.from(form.querySelectorAll('input[type=checkbox][data-tool]:checked')).map((c) => c.dataset.tool),
      },
    };
  }

  static _html(view) {
    const esc = HtmlEscaper.escape;
    const editing = !!view.agent;
    const cur = view.agent || AgentForm.BLANK;
    return '<h3 class="luma-form-title">' + (editing ? 'Edit agent' : 'New agent') + '</h3>'
      + '<label class="luma-field"><span>Name</span>'
      + '<input name="name" type="text" value="' + esc(cur.name) + '" placeholder="Research" /></label>'
      + '<label class="luma-field"><span>Description</span>'
      + '<input name="description" type="text" value="' + esc(cur.description) + '" '
      + 'placeholder="Searches the web and summarises findings" /></label>'
      + '<label class="luma-field"><span>System prompt</span>'
      + '<textarea name="systemPrompt" rows="5" placeholder="You are a meticulous research assistant…">'
      + esc(cur.systemPrompt) + '</textarea></label>'
      + '<label class="luma-field"><span>Model</span>'
      + '<select name="modelRef">' + AgentForm._modelOptions(view, cur) + '</select></label>'
      + '<div class="luma-field"><span>Tools <small>(LLM access is always included)</small></span>'
      + '<div class="am-tools luma-scrollbox">' + AgentForm._toolsHtml(view.toolGroups, new Set(cur.tools || [])) + '</div></div>'
      + '<div class="luma-field"><span>Knowledge base <small>(PDF, text, Markdown, or HTML; the agent '
      + 'searches these documents before answering)</small></span>'
      + '<div class="am-kb"></div></div>'
      + '<div class="luma-form-err"></div>'
      + '<div class="luma-form-actions">'
      + '<button type="button" class="luma-btn" data-cancel>Cancel</button>'
      + '<button type="submit" class="luma-btn primary">' + (editing ? 'Save' : 'Create agent') + '</button>'
      + '</div>';
  }

  static _modelOptions(view, cur) {
    const esc = HtmlEscaper.escape;
    const first = '<option value="">App default' + (view.defaultRef ? ' (' + esc(view.modelLabel(view.defaultRef)) + ')' : '') + '</option>';
    return [first].concat(view.models.map((m) =>
      '<option value="' + esc(m.ref) + '"' + (cur.modelRef === m.ref ? ' selected' : '') + '>' + esc(m.label) + '</option>')).join('');
  }

  static _toolsHtml(groups, selected) {
    const esc = HtmlEscaper.escape;
    if (!groups.length) return '<div class="luma-empty">No tools available. The agent will be LLM-only.</div>';
    return groups.map((g) =>
      '<div class="am-toolgroup"><div class="am-toolgroup-label">' + esc(g.label || g.id) + '</div>'
      + g.tools.map((t) =>
        '<label class="am-tool"><input type="checkbox" data-tool="' + esc(t.name) + '"'
        + (selected.has(t.name) ? ' checked' : '') + '> ' + esc(t.label || t.name) + '</label>').join('')
      + '</div>').join('');
  }
}
