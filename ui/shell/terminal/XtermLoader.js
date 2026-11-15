export default class XtermLoader {
  static async load() {
    const [core, fit] = await Promise.all([
      import('../../../node_modules/@xterm/xterm/lib/xterm.mjs'),
      import('../../../node_modules/@xterm/addon-fit/lib/addon-fit.mjs'),
    ]);
    return { Terminal: core.Terminal, FitAddon: fit.FitAddon };
  }
}
