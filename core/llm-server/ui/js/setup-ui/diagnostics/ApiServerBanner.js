import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ApiServerBanner {
  static SETTINGS_TAB = 'apimcp';

  static async render(doc, api, bannerId = 'apiServerBanner') {
    const banner = doc.getElementById(bannerId);
    if (!banner) return;
    const server = api && api.apiServer;
    if (!server || typeof server.status !== 'function') { banner.hidden = true; return; }
    let status = null;
    try { status = await server.status(); } catch (_) { status = null; }
    const view = ApiServerBanner.view(status);
    banner.hidden = !view;
    banner.innerHTML = view ? view.html : '';
    const link = banner.querySelector('[data-open-settings]');
    if (link && typeof api.openAppSettings === 'function') {
      link.addEventListener('click', () => { api.openAppSettings(ApiServerBanner.SETTINGS_TAB).catch(() => {}); });
    }
  }

  static view(status) {
    if (!status || !status.enabled || status.listening) return null;
    const port = status.port || status.configuredPort || 3000;
    const owner = status.conflict && status.conflict.owner ? ' by ' + HtmlEscaper.escape(status.conflict.owner) : ' by another program';
    const inUse = /EADDRINUSE|in use/i.test(status.error || '') || !!(status.conflict && status.conflict.kind !== 'unknown');
    const why = inUse
      ? `port ${Number(port)} is in use${owner}`
      : HtmlEscaper.escape(status.error || 'it could not start');
    return {
      html: `<strong>The local API server is not running:</strong> ${why}. Extension tabs, the Dashboard and the CLI need it. `
        + 'LumaBrowser keeps retrying the port; to move it, '
        + '<button type="button" class="luma-btn link" data-open-settings>open Settings &gt; API &amp; MCP</button>.',
    };
  }
}
