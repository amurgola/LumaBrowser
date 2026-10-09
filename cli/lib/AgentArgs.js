const fs = require('fs');

class AgentArgs {
  static VALUE_FLAGS = {
    '--resume': 'resume',
    '--cwd': 'cwd',
  };

  static SWITCHES = {
    '-p': 'print', '--print': 'print', '--json': 'json', '--yes': 'yes', '-y': 'yes',
    '--show-reasoning': 'showReasoning', '--no-start': 'noStart', '--plain': 'plain',
    '--no-suggest': 'noSuggest', '--agents': 'agents', '-h': 'help', '--help': 'help',
  };

  static defaults() {
    return { agent: null, prompt: [], print: false, json: false, resume: null, yes: false, cwd: null, showReasoning: false, noStart: false, agents: false, help: false, plain: false, noSuggest: false };
  }

  static parse(argv, { readFile = (f) => fs.readFileSync(f, 'utf8'), platform = process.platform } = {}) {
    const o = AgentArgs.defaults();
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (AgentArgs.SWITCHES[a]) o[AgentArgs.SWITCHES[a]] = true;
      else if (AgentArgs.VALUE_FLAGS[a]) o[AgentArgs.VALUE_FLAGS[a]] = argv[++i] || null;
      else if (a === '--container') o.cwd = AgentArgs.containerCwd(argv[++i], platform);
      else if (a === '--prompt-file') o.prompt.push(readFile(String(argv[++i] || '')));
      else if (a.startsWith('-') && a.length > 1 && !o.agent) throw new Error(`unknown flag: ${a}`);
      else if (!o.agent) o.agent = a;
      else o.prompt.push(a);
    }
    return o;
  }

  static containerCwd(spec, platform = process.platform) {
    const s = String(spec || '');
    const colon = s.indexOf(':');
    const name = colon === -1 ? s : s.slice(0, colon);
    const dir = colon === -1 ? '/' : s.slice(colon + 1) || '/';
    if (!name || !dir.startsWith('/')) throw new Error('--container expects <name> or <name>:/absolute/dir');
    return `${platform === 'win32' ? '//docker/' : '/.luma-docker/'}${name}${dir}`;
  }
}

module.exports = AgentArgs;
