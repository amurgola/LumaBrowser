class ModuleScriptBundler {
  static IMPORT_RE = /^import ([A-Za-z_$][\w$]*) from '([^']+)';[ \t]*\r?$/gm;
  static EXPORT_RE = /^export default class ([A-Za-z_$][\w$]*)/m;
  static LEFTOVER_RE = /^[ \t]*(import|export)[ \t{*]/m;
  static BASE = 'http://bundle.invalid';

  constructor({ readAsset, importMap = null }) {
    this._read = readAsset;
    this._imports = (importMap && importMap.imports) || {};
  }

  bundle(entryUrl) {
    const order = [];
    this._visit(entryUrl, new Set(), new Set(), order);
    return '(function () {\n\'use strict\';\nconst __modules = Object.create(null);\n'
      + order.map((m) => ModuleScriptBundler._wrap(m)).join('\n')
      + '\n})();';
  }

  resolve(spec, fromUrl) {
    const pathname = new URL(spec, ModuleScriptBundler.BASE + fromUrl).pathname;
    const prefix = Object.keys(this._imports).sort((a, b) => b.length - a.length).find((p) => pathname.startsWith(p));
    return prefix ? this._imports[prefix] + pathname.slice(prefix.length) : pathname;
  }

  _visit(url, done, active, order) {
    if (done.has(url)) return;
    if (active.has(url)) throw new Error(`ModuleScriptBundler: import cycle at ${url}`);
    active.add(url);
    const module = this._parse(url);
    for (const dep of module.imports) this._visit(dep.url, done, active, order);
    active.delete(url);
    done.add(url);
    order.push(module);
  }

  _parse(url) {
    const source = String(this._read(url));
    const imports = [...source.matchAll(ModuleScriptBundler.IMPORT_RE)].map((m) => ({ local: m[1], url: this.resolve(m[2], url) }));
    const exported = source.match(ModuleScriptBundler.EXPORT_RE);
    const body = source.replace(ModuleScriptBundler.IMPORT_RE, '').replace(ModuleScriptBundler.EXPORT_RE, 'class $1');
    if (ModuleScriptBundler.LEFTOVER_RE.test(body)) throw new Error(`ModuleScriptBundler: unsupported module syntax in ${url}`);
    return { url, imports, body, exported: exported ? exported[1] : null };
  }

  static _wrap(module) {
    const key = JSON.stringify(module.url);
    const deps = module.imports.map((d) => `const ${d.local} = __modules[${JSON.stringify(d.url)}];\n`).join('');
    const ret = module.exported ? `\nreturn ${module.exported};` : '';
    return `__modules[${key}] = (function () {\n${deps}${module.body}${ret}\n})();`;
  }
}

module.exports = ModuleScriptBundler;
