const fs = require('fs');
const path = require('path');

class PreloadBundle {
  static LOCAL_REQUIRE = /require\(\s*(['"])(\.{1,2}\/[^'"]+)\1\s*\)/g;

  static write(entryFile, outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, PreloadBundle.build(entryFile));
    return outFile;
  }

  static build(entryFile) {
    const modules = PreloadBundle._collect(path.resolve(entryFile));
    const root = path.dirname(path.resolve(entryFile));
    const idOf = (file) => path.relative(root, file).split(path.sep).join('/');
    const table = [...modules].map(([file, mod]) => PreloadBundle._entry(idOf(file), mod, idOf));
    return [
      `// Generated at startup by PreloadBundle from ${path.basename(entryFile)}. Do not edit.`,
      '(function (hostRequire) {',
      `  const modules = {\n${table.join(',\n')}\n  };`,
      '  const cache = {};',
      '  function load(id) {',
      '    if (cache[id]) return cache[id].exports;',
      '    const module = cache[id] = { exports: {} };',
      '    const [run, locals] = modules[id];',
      '    const require = (request) => (Object.prototype.hasOwnProperty.call(locals, request) ? load(locals[request]) : hostRequire(request));',
      '    run.call(module.exports, module, module.exports, require);',
      '    return module.exports;',
      '  }',
      `  load(${JSON.stringify(idOf(path.resolve(entryFile)))});`,
      '})(require);',
      '',
    ].join('\n');
  }

  static _collect(entryFile) {
    const modules = new Map();
    const pending = [entryFile];
    while (pending.length) {
      const file = pending.pop();
      if (modules.has(file)) continue;
      const source = fs.readFileSync(file, 'utf8');
      const locals = PreloadBundle._localRequires(source, file);
      modules.set(file, { source, locals });
      pending.push(...locals.values());
    }
    return modules;
  }

  static _localRequires(source, fromFile) {
    const locals = new Map();
    for (const match of source.matchAll(PreloadBundle.LOCAL_REQUIRE)) {
      locals.set(match[2], PreloadBundle._resolve(path.dirname(fromFile), match[2]));
    }
    return locals;
  }

  static _resolve(dir, request) {
    const base = path.resolve(dir, request);
    const found = [base, `${base}.js`, path.join(base, 'index.js')].find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
    if (!found) throw new Error(`PreloadBundle: cannot resolve ${request} from ${dir}`);
    return found;
  }

  static _entry(id, mod, idOf) {
    const locals = Object.fromEntries([...mod.locals].map(([request, file]) => [request, idOf(file)]));
    return `    ${JSON.stringify(id)}: [function (module, exports, require) {\n${mod.source}\n    }, ${JSON.stringify(locals)}]`;
  }
}

module.exports = PreloadBundle;
