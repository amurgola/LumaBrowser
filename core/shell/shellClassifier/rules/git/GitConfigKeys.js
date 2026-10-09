class GitConfigKeys {
  static PROGRAM_KEYS = Object.freeze([
    { label: 'a pager', patterns: ['core.pager', 'pager.*'] },
    { label: 'an editor', patterns: ['core.editor', 'sequence.editor'] },
    { label: 'an ssh or transport command', patterns: ['core.sshCommand', 'core.gitProxy', 'remote.*.uploadpack', 'remote.*.receivepack', 'protocol.allow', 'protocol.ext.allow'] },
    { label: 'a credential or password helper', patterns: ['credential.helper', 'credential.*.helper', 'core.askPass'] },
    { label: 'a diff or merge driver', patterns: ['diff.external', 'diff.*.textconv', 'diff.*.command', 'merge.*.driver', 'difftool.*.cmd', 'mergetool.*.cmd', 'interactive.diffFilter'] },
    { label: 'a content filter', patterns: ['filter.*.clean', 'filter.*.smudge', 'filter.*.process'] },
    { label: 'a hook or file-system monitor', patterns: ['core.hooksPath', 'core.fsmonitor', 'hook.*.command'] },
    { label: 'a signing program', patterns: ['gpg.program', 'gpg.*.program'] },
    { label: 'an alias', patterns: ['alias.*'] },
    { label: 'an included config file', patterns: ['include.path', 'includeIf.*.path'] },
    { label: 'a browser or viewer', patterns: ['web.browser', 'browser.*.cmd', 'browser.*.path', 'man.viewer', 'man.*.cmd', 'man.*.path'] },
    { label: 'a helper command', patterns: ['core.alternateRefsCommand', 'uploadpack.packObjectsHook', 'sendemail.sendmailCmd', 'sendemail.smtpServer', 'sendemail.toCmd', 'sendemail.ccCmd'] },
  ]);

  static PROGRAM_VARIABLES = Object.freeze({
    GIT_SSH: 'an ssh or transport command',
    GIT_SSH_COMMAND: 'an ssh or transport command',
    GIT_PROXY_COMMAND: 'an ssh or transport command',
    GIT_PAGER: 'a pager',
    PAGER: 'a pager',
    GIT_EDITOR: 'an editor',
    GIT_SEQUENCE_EDITOR: 'an editor',
    EDITOR: 'an editor',
    VISUAL: 'an editor',
    GIT_ASKPASS: 'a credential or password helper',
    SSH_ASKPASS: 'a credential or password helper',
    GIT_EXTERNAL_DIFF: 'a diff or merge driver',
    GIT_EXEC_PATH: 'the directory git runs its subcommands from',
    GIT_TEMPLATE_DIR: 'a hook template directory',
    GIT_CONFIG_PARAMETERS: 'config that can name any program',
    GIT_CONFIG_GLOBAL: 'a replacement config file',
    GIT_CONFIG_SYSTEM: 'a replacement config file',
    GIT_CONFIG: 'a replacement config file',
  });

  static NETWORK_ONLY_LABELS = new Set(['an ssh or transport command', 'a credential or password helper']);

  static INERT_VALUES = new Set(['', 'true', ':', 'cat', 'less', 'more', 'false']);

  static programLabel(key) {
    const parts = GitConfigKeys._split(key);
    if (!parts) return null;
    const group = GitConfigKeys.PROGRAM_KEYS.find((entry) => entry.patterns.some((pattern) => GitConfigKeys._matches(pattern, parts)));
    return group ? group.label : null;
  }

  static variableLabel(name, value) {
    if (/^GIT_CONFIG_KEY_\d+$/.test(name)) return GitConfigKeys.programLabel(value);
    return Object.prototype.hasOwnProperty.call(GitConfigKeys.PROGRAM_VARIABLES, name) ? GitConfigKeys.PROGRAM_VARIABLES[name] : null;
  }

  static isNetworkOnly(label) {
    return GitConfigKeys.NETWORK_ONLY_LABELS.has(label);
  }

  static isInert(value) {
    if (value === null || value === undefined) return false;
    return GitConfigKeys.INERT_VALUES.has(GitConfigKeys._unquote(value).trim());
  }

  static _split(key) {
    const text = String(key || '');
    const first = text.indexOf('.');
    const last = text.lastIndexOf('.');
    if (first <= 0 || last === text.length - 1) return null;
    return {
      section: text.slice(0, first).toLowerCase(),
      subsection: first === last ? null : text.slice(first + 1, last),
      variable: text.slice(last + 1).toLowerCase(),
    };
  }

  static _matches(pattern, parts) {
    const pieces = pattern.split('.');
    const [section, middle, variable] = pieces.length === 2 ? [pieces[0], null, pieces[1]] : pieces;
    if (section.toLowerCase() !== parts.section) return false;
    if (variable !== '*' && variable.toLowerCase() !== parts.variable) return false;
    if (variable === '*') return true;
    if (middle === null) return parts.subsection === null;
    return middle === '*' ? parts.subsection !== null : middle.toLowerCase() === String(parts.subsection).toLowerCase();
  }

  static _unquote(value) {
    return String(value).replace(/^(['"])(.*)\1$/, '$2');
  }
}

module.exports = GitConfigKeys;
