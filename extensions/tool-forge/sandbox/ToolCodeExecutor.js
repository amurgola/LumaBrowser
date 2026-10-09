class ToolCodeExecutor {
  static PREAMBLE = '"use strict";\n';
  static EPILOGUE = "\n;if (typeof run !== 'function') "
    + "throw new Error('Your tool code must declare an async function named run(args, ctx).');\n"
    + 'return run(args, ctx);';

  static async execute({ code, args, ctx, FunctionCtor }) {
    const compiled = ToolCodeExecutor._compile(code, FunctionCtor || Function);
    if (compiled.error) return { ok: false, error: compiled.error };
    try {
      return ToolCodeExecutor._serializable(await compiled.fn(args || {}, ctx || {}));
    } catch (error) {
      return { ok: false, error: `Tool threw: ${(error && error.message) || error}` };
    }
  }

  static _compile(code, FunctionCtor) {
    try {
      return { fn: new FunctionCtor('args', 'ctx', ToolCodeExecutor.PREAMBLE + String(code || '') + ToolCodeExecutor.EPILOGUE) };
    } catch (error) {
      return { error: `Tool code failed to compile: ${(error && error.message) || error}` };
    }
  }

  static _serializable(result) {
    try {
      return { ok: true, result: JSON.parse(JSON.stringify(result === undefined ? null : result)) };
    } catch (_) {
      return {
        ok: false,
        error: 'Tool returned a value that cannot be serialized (functions, circular refs, etc.). Return plain JSON-compatible data.',
      };
    }
  }
}

module.exports = ToolCodeExecutor;
