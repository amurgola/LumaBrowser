export default class ApiSecurityCard {
  static async render(doc, apiSecurity, pillId = 'apiSecurityPill', bodyId = 'apiSecurityBody') {
    const pill = doc.getElementById(pillId);
    const body = doc.getElementById(bodyId);
    if (!pill || !body) return;
    body.className = '';
    if (!apiSecurity || typeof apiSecurity.get !== 'function') {
      ApiSecurityCard._paint(pill, 'luma-badge accent', 'n/a');
      body.textContent = 'API security status unavailable.';
      return;
    }
    try {
      const view = ApiSecurityCard.view(await apiSecurity.get());
      ApiSecurityCard._paint(pill, view.pillClass, view.pillText);
      body.innerHTML = view.html;
    } catch (err) {
      ApiSecurityCard._paint(pill, 'luma-badge bad', 'error');
      body.textContent = `Failed to read API security: ${err && err.message ? err.message : err}`;
    }
  }

  static view(cfg) {
    const required = !!(cfg && cfg.requireApiKey);
    const keyCount = (cfg && Array.isArray(cfg.apiKeys)) ? cfg.apiKeys.length : 0;
    const ok = required && keyCount > 0;
    return {
      pillClass: 'luma-badge ' + (ok ? 'ok' : (required ? 'bad' : 'accent')),
      pillText: ok ? `${keyCount} ${keyCount === 1 ? 'key' : 'keys'}` : (required ? 'no keys' : 'off'),
      html: ApiSecurityCard._message(required, keyCount),
    };
  }

  static _message(required, keyCount) {
    if (!required) {
      return 'API security is off. The local LLM and Image servers accept any request on 127.0.0.1.<br><br>'
        + 'If you ever expose either server beyond localhost, enable API security in General Settings → API Security so a Bearer key is required.';
    }
    if (keyCount === 0) {
      return '<strong>API security is on but no keys exist.</strong> The local LLM and Image servers will refuse to start until you create a key in General Settings → API Security.';
    }
    return `API security is on. Both local servers require a Bearer key (${keyCount} configured).<br><br>`
      + 'llama-server enforces the first key natively. sd-server is fronted by a Node proxy that accepts any of the configured keys.<br><br>'
      + 'Manage keys in General Settings → API Security. Key changes take effect on the next server start.';
  }

  static _paint(pill, cls, text) {
    pill.className = cls;
    pill.textContent = text;
  }
}
