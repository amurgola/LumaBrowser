import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import KeyValueLines from './KeyValueLines.js';

export default class McpServerForm {
  static BLANK = { name: '', transport: 'stdio', enabled: true, command: '', args: [], env: {}, cwd: '', url: '', headers: {} };

  static render(server, transport, on) {
    const form = document.createElement('form');
    form.className = 'luma-form';
    form.innerHTML = McpServerForm._html(server, transport);
    form.querySelector('[name=transport]').addEventListener('change', (e) => on.transportChanged({
      name: form.querySelector('[name=name]').value,
      enabled: form.querySelector('[name=enabled]').checked,
      transport: e.target.value,
    }));
    form.querySelector('[data-cancel]').addEventListener('click', on.cancel);
    form.addEventListener('submit', (e) => { e.preventDefault(); on.submit(form); });
    return form;
  }

  static collect(form) {
    const value = (name) => form.querySelector(`[name=${name}]`).value;
    const name = value('name').trim();
    if (!name) return { error: 'Name is required.' };
    const patch = { name, transport: value('transport'), enabled: form.querySelector('[name=enabled]').checked };
    return patch.transport === 'stdio' ? McpServerForm._stdio(patch, value) : McpServerForm._http(patch, value);
  }

  static _stdio(patch, value) {
    patch.command = value('command').trim();
    patch.args = value('args');
    patch.env = KeyValueLines.parse(value('env'));
    patch.cwd = value('cwd').trim();
    return patch.command ? { patch } : { error: 'A command is required for a stdio server.' };
  }

  static _http(patch, value) {
    patch.url = value('url').trim();
    patch.headers = KeyValueLines.parse(value('headers'));
    return patch.url ? { patch } : { error: 'A URL is required.' };
  }

  static _html(server, transport) {
    const esc = HtmlEscaper.escape;
    const cur = server || McpServerForm.BLANK;
    const option = (v, label) => '<option value="' + v + '"' + (transport === v ? ' selected' : '') + '>' + label + '</option>';
    return '<h3 class="luma-form-title">' + (server && server.id ? 'Edit server' : 'Add MCP server') + '</h3>'
      + '<label class="luma-field"><span>Name</span>'
      + '<input name="name" type="text" value="' + esc(cur.name) + '" placeholder="Filesystem" /></label>'
      + '<label class="luma-field"><span>Transport</span>'
      + '<select name="transport">'
      + option('stdio', 'stdio (local command)')
      + option('http', 'Streamable HTTP')
      + option('sse', 'SSE (legacy HTTP)')
      + '</select></label>'
      + '<div class="mcpc-transport-fields">' + (transport === 'stdio' ? McpServerForm._stdioFields(cur) : McpServerForm._httpFields(cur)) + '</div>'
      + '<label class="luma-check"><input name="enabled" type="checkbox"' + (cur.enabled !== false ? ' checked' : '') + '> '
      + 'Enabled (connect now)</label>'
      + '<div class="luma-form-err"></div>'
      + '<div class="luma-form-actions">'
      + '<button type="button" class="luma-btn" data-cancel>Cancel</button>'
      + '<button type="submit" class="luma-btn primary" data-save>' + McpServerForm.saveLabel(server) + '</button>'
      + '</div>';
  }

  static saveLabel(server) {
    return server && server.id ? 'Save' : 'Add server';
  }

  static _stdioFields(cur) {
    const esc = HtmlEscaper.escape;
    return '<label class="luma-field"><span>Command</span>'
      + '<input name="command" type="text" value="' + esc(cur.command) + '" placeholder="npx" /></label>'
      + '<label class="luma-field"><span>Arguments <small>(space-separated, quotes ok)</small></span>'
      + '<input name="args" type="text" value="' + esc((cur.args || []).join(' ')) + '" '
      + 'placeholder="-y @modelcontextprotocol/server-filesystem /data" /></label>'
      + '<label class="luma-field"><span>Working dir <small>(optional)</small></span>'
      + '<input name="cwd" type="text" value="' + esc(cur.cwd) + '" placeholder="" /></label>'
      + '<label class="luma-field"><span>Environment <small>(KEY=value per line)</small></span>'
      + '<textarea name="env" rows="3" placeholder="API_KEY=sk-...">' + esc(KeyValueLines.format(cur.env)) + '</textarea></label>';
  }

  static _httpFields(cur) {
    const esc = HtmlEscaper.escape;
    return '<label class="luma-field"><span>URL</span>'
      + '<input name="url" type="text" value="' + esc(cur.url) + '" placeholder="https://example.com/mcp" /></label>'
      + '<label class="luma-field"><span>Headers <small>(KEY=value per line, for example Authorization=Bearer ...)</small></span>'
      + '<textarea name="headers" rows="3" placeholder="Authorization=Bearer ...">' + esc(KeyValueLines.format(cur.headers)) + '</textarea></label>';
  }
}
