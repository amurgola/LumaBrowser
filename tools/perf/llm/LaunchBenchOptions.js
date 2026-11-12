const path = require('path');

class LaunchBenchOptions {
  static DEFAULT_RUNTIME = 'llama-cpp-cuda13';
  static DEFAULT_CONTEXT = 32768;
  static DEFAULT_PREDICT = 384;

  static DEFAULT_WARM = 16;
  static LABEL_PATTERN = /^[a-zA-Z0-9_-]+$/;

  static USAGE = 'usage: npm run bench:llm-launch -- --model <gguf or folder> [--label <name>] [--runtime <id> | --binary <llama-server> --version b<N>]\n'
    + '  [--pin <cuda indices>] [--ctx <tokens>] [--n-predict <tokens>] [--warm <tokens>] [--chat] [--long <tokens>] [--port <n>] [--out <dir>]\n'
    + '  [--variant <name> [--set FLAG=VALUE ...] [--drop FLAG ...] [--env KEY=VALUE ...]]...\n'
    + 'With no --variant the planned launch runs once as "planned". Each --variant starts from the planned argv.';

  static parse(argv = []) {
    const o = {
      model: null, label: 'run', runtimeId: LaunchBenchOptions.DEFAULT_RUNTIME, binaryPath: null, version: null, pin: null,
      contextSize: LaunchBenchOptions.DEFAULT_CONTEXT, nPredict: LaunchBenchOptions.DEFAULT_PREDICT, warmTokens: LaunchBenchOptions.DEFAULT_WARM, chat: false, longPredict: 0,
      port: 18099, outDir: null, variants: [], help: false,
    };
    let current = null;
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      const next = () => { if (i + 1 >= argv.length) throw new Error(`${a} needs a value`); return argv[++i]; };
      switch (a) {
        case '--help': case '-h': o.help = true; break;
        case '--model': o.model = next(); break;
        case '--label': o.label = next(); break;
        case '--runtime': o.runtimeId = next(); break;
        case '--binary': o.binaryPath = next(); break;
        case '--version': o.version = next(); break;
        case '--pin': o.pin = next(); break;
        case '--ctx': o.contextSize = LaunchBenchOptions._int(a, next()); break;
        case '--n-predict': o.nPredict = LaunchBenchOptions._int(a, next()); break;
        case '--warm': o.warmTokens = LaunchBenchOptions._int(a, next()); break;
        case '--chat': o.chat = true; break;
        case '--long': o.longPredict = LaunchBenchOptions._int(a, next()); break;
        case '--port': o.port = LaunchBenchOptions._int(a, next()); break;
        case '--out': o.outDir = next(); break;
        case '--variant': current = { name: next(), set: [], drop: [], env: {} }; o.variants.push(current); break;
        case '--set': LaunchBenchOptions._variant(current, a).set.push(LaunchBenchOptions._pair(a, next())); break;
        case '--drop': LaunchBenchOptions._variant(current, a).drop.push(next()); break;
        case '--env': { const [k, v] = LaunchBenchOptions._pair(a, next()); LaunchBenchOptions._variant(current, a).env[k] = v; break; }
        default: throw new Error(`unknown option ${a}`);
      }
    }
    if (o.help) return o;
    if (!o.model) throw new Error('--model is required');
    if (!LaunchBenchOptions.LABEL_PATTERN.test(o.label)) throw new Error('label must be alphanumeric');
    if (o.binaryPath && !o.version) throw new Error('--binary needs --version b<N> so the planner knows the build');
    if (!o.variants.length) o.variants.push({ name: 'planned', set: [], drop: [], env: {} });
    const names = new Set();
    for (const v of o.variants) {
      if (!LaunchBenchOptions.LABEL_PATTERN.test(v.name)) throw new Error(`variant name ${v.name} must be alphanumeric`);
      if (names.has(v.name)) throw new Error(`duplicate variant ${v.name}`);
      names.add(v.name);
    }
    o.model = path.resolve(o.model);
    return o;
  }

  static applyVariant(args, variant) {
    let out = args.slice();
    for (const flag of variant.drop) {
      const i = out.indexOf(flag);
      if (i < 0) continue;
      const hasValue = i + 1 < out.length && !out[i + 1].startsWith('-');
      out.splice(i, hasValue ? 2 : 1);
    }
    for (const [flag, value] of variant.set) {
      const i = out.indexOf(flag);
      if (i >= 0) out[i + 1] = value; else out = [...out, flag, value];
    }
    return out;
  }

  static _variant(current, a) {
    if (!current) throw new Error(`${a} must follow a --variant`);
    return current;
  }

  static _pair(a, text) {
    const eq = text.indexOf('=');
    if (eq <= 0) throw new Error(`${a} expects FLAG=VALUE, got ${text}`);
    return [text.slice(0, eq), text.slice(eq + 1)];
  }

  static _int(a, text) {
    const n = Number(text);
    if (!Number.isInteger(n) || n < 0) throw new Error(`${a} expects a whole number, got ${text}`);
    return n;
  }
}

module.exports = LaunchBenchOptions;
