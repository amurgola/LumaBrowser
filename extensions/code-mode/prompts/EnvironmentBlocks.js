class EnvironmentBlocks {
  static environment(env) {
    if (!env) return null;
    return `<environment>
This LumaBrowser install currently provides the following. Depend ONLY on what is listed here.
Core services (use as manifest dependencies.required keys, e.g. { 'core:browser': {} }):
  ${EnvironmentBlocks._coreServices(env)}
Other installed extensions you can build on: to use one, add "ext:<id>" to dependencies and call
its API via \`context.extensions["<id>"].<method>(...)\` (only the methods listed exist), or call
its REST routes under /api/ext/<id>:
${EnvironmentBlocks._extensionLines(env)}
</environment>`;
  }

  static apiReference(env) {
    if (!env || !Array.isArray(env.contextApi) || !env.contextApi.length) return null;
    return `<api_reference>
Authoritative \`context.*\` surface (the SAME catalog the extension editor autocompletes from;
use these EXACT names; if a method isn't listed here, it does not exist):
${env.contextApi.map((p) => EnvironmentBlocks._apiLine(p)).join('\n')}${EnvironmentBlocks._manifestFields(env)}
</api_reference>`;
  }

  static _coreServices(env) {
    return Array.isArray(env.coreServices) && env.coreServices.length ? env.coreServices.join(', ') : '(none)';
  }

  static _extensionLines(env) {
    const exts = Array.isArray(env.extensions) ? env.extensions : [];
    if (!exts.length) return '(no other extensions are installed)';
    return exts.map((e) => EnvironmentBlocks._extensionLine(e)).join('\n');
  }

  static _extensionLine(e) {
    const api = e.api && e.api.length ? ` | API: ${e.api.join(', ')}` : '';
    const tools = e.tools && e.tools.length ? ` | tools: ${e.tools.join(', ')}` : '';
    const routes = e.hasRoutes ? ` | routes: /api/ext/${e.id}` : '';
    const desc = e.description ? `: ${e.description}` : '';
    return `- ${e.id} (${e.name})${desc}${api}${tools}${routes}`;
  }

  static _apiLine(p) {
    const doc = String(p.doc || '').replace(/\s*\n\s*/g, ' ').trim();
    return `- context.${p.name}${p.detail ? ` (${p.detail})` : ''}: ${doc}`;
  }

  static _manifestFields(env) {
    if (!Array.isArray(env.manifestFields) || !env.manifestFields.length) return '';
    return `\nManifest fields: ${env.manifestFields.map((f) => f.name).join(', ')}.`;
  }
}

module.exports = EnvironmentBlocks;
