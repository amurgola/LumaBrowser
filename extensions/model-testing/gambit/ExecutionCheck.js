const CodeSandbox = require('./CodeSandbox');
const LiveArtifactStubs = require('./LiveArtifactStubs');

class ExecutionCheck {
  static FENCED_CODE = /```(?:js|javascript)?\s*\n([\s\S]*?)```/i;

  static async runExecutionCheck(task, transcripts) {
    const spec = task && task.execute;
    if (!spec) return { ran: false, cases: [], error: 'task has no execute block' };
    const { code, from } = ExecutionCheck.extractCode(task, transcripts);
    if (!code) return { ran: false, cases: [], error: 'model produced no runnable code' };
    const isLive = (spec.source || 'artifact') === 'live';
    const runnable = isLive ? ExecutionCheck._wrapLiveModule(code) : code;
    const ctx = isLive ? { __inject: LiveArtifactStubs.create() } : {};
    const cases = Array.isArray(spec.cases) ? spec.cases : [];
    const results = cases.length
      ? await ExecutionCheck._runCases(runnable, ctx, cases)
      : [await ExecutionCheck._runLoadOnly(runnable, ctx)];
    return { ran: true, from, cases: results };
  }

  static extractCode(task, transcripts) {
    const live = ((task.execute && task.execute.source) || 'artifact') === 'live';
    const tool = live ? 'create_live_artifact' : 'create_artifact';
    const field = live ? 'js' : 'content';
    return ExecutionCheck._codeFromToolCalls(transcripts, tool, field)
      || ExecutionCheck._codeFromFence(transcripts)
      || { code: null, from: null };
  }

  static checkCase(expect, value) {
    if (!expect) return { passed: true, detail: 'no expectation' };
    if ('equals' in expect) {
      const ok = ExecutionCheck._deepEqual(value, expect.equals);
      return { passed: ok, detail: ok ? '' : `got ${JSON.stringify(value)}, want ${JSON.stringify(expect.equals)}` };
    }
    if ('lastEquals' in expect) {
      const last = Array.isArray(value) ? value[value.length - 1] : undefined;
      const ok = ExecutionCheck._deepEqual(last, expect.lastEquals);
      return { passed: ok, detail: ok ? '' : `last element ${JSON.stringify(last)}, want ${JSON.stringify(expect.lastEquals)}` };
    }
    if ('contains' in expect) {
      const ok = String(value == null ? '' : JSON.stringify(value)).includes(String(expect.contains));
      return { passed: ok, detail: ok ? '' : `got ${JSON.stringify(value)}` };
    }
    return { passed: false, detail: 'unrecognised case expectation' };
  }

  static _codeFromToolCalls(transcripts, tool, field) {
    for (const transcript of transcripts) {
      for (const call of (transcript && transcript.toolCalls) || []) {
        if (call.tool !== tool) continue;
        const code = call.params && call.params[field];
        if (typeof code === 'string' && code.trim()) return { code, from: `${tool}.${field}` };
      }
    }
    return null;
  }

  static _codeFromFence(transcripts) {
    for (const transcript of transcripts) {
      const match = String((transcript && transcript.finalResponse) || '').match(ExecutionCheck.FENCED_CODE);
      if (match && match[1].trim()) return { code: match[1], from: 'chat code fence' };
    }
    return null;
  }

  static _wrapLiveModule(code) {
    const names = LiveArtifactStubs.INJECTED;
    return 'async function run(args, ctx) {\n'
      + `  return (async function (${names.join(', ')}) {\n`
      + `${String(code)}\n`
      + "    return 'mounted';\n"
      + `  })(${names.map((n) => `ctx.__inject.${n}`).join(', ')});\n}`;
  }

  static async _runLoadOnly(code, ctx) {
    const run = await CodeSandbox.runOnce({ code, args: {}, ctx });
    return run.ok
      ? { passed: true, detail: 'loaded without throwing' }
      : { passed: false, detail: run.error };
  }

  static async _runCases(code, ctx, cases) {
    const results = [];
    for (const c of cases) {
      const run = await CodeSandbox.runOnce({ code, args: c.args || {}, ctx });
      results.push(run.ok ? ExecutionCheck.checkCase(c.expect, run.result) : { passed: false, detail: run.error });
    }
    return results;
  }

  static _deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

module.exports = ExecutionCheck;
