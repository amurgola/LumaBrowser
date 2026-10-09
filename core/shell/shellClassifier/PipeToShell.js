const ShellCommandName = require('./ShellCommandName');

class PipeToShell {
  static SINKS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish', 'iex', 'invoke-expression', 'powershell', 'pwsh', 'cmd', 'python', 'python3', 'perl', 'ruby', 'node', 'php']);
  static FETCHERS = new Set(['curl', 'wget', 'invoke-webrequest', 'iwr', 'invoke-restmethod', 'irm', 'fetch', 'http', 'https', 'aria2c']);
  static INTERPRETERS = ['python', 'python3', 'perl', 'ruby', 'node', 'php'];
  static POSIX_SHELLS = ['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish'];
  static INLINE_CODE_FLAGS = ['-c', '-e', '--eval', '-r'];

  static assess(command, name, previous) {
    if (command.joinedBy !== 'pipe' || !PipeToShell.SINKS.has(name)) return null;
    if (PipeToShell._runsScriptFile(name, command.args)) return null;
    const upstream = previous && previous.name ? ShellCommandName.base(previous.name) : null;
    if (upstream && PipeToShell.FETCHERS.has(upstream)) {
      return { tier: 'forbidden', reason: 'Piping a download straight into a shell runs code nobody has read.' };
    }
    return { tier: 'mass-destructive', reason: `Piping into ${name} runs whatever the upstream command printed.` };
  }

  static _runsScriptFile(name, args) {
    if (PipeToShell.INTERPRETERS.includes(name)) return PipeToShell._interpreterRunsFile(args);
    if (PipeToShell.POSIX_SHELLS.includes(name)) return args.some((arg) => !arg.startsWith('-') && arg !== '-' && arg !== '-s');
    if (name === 'powershell' || name === 'pwsh') return args.some((arg) => /^-(f|file)$/i.test(arg));
    return false;
  }

  static _interpreterRunsFile(args) {
    const hasScript = args.some((arg) => !arg.startsWith('-') && arg !== '-');
    const readsStdin = args.includes('-');
    const hasInlineCode = args.some((arg) => PipeToShell.INLINE_CODE_FLAGS.includes(arg));
    return hasScript && !readsStdin && !hasInlineCode;
  }
}

module.exports = PipeToShell;
