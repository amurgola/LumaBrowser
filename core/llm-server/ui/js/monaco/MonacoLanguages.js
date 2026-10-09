export default class MonacoLanguages {
  static MAP = {
    js: 'javascript', javascript: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'typescript', typescript: 'typescript',
    tsx: 'typescript', jsx: 'javascript',
    py: 'python', python: 'python',
    rb: 'ruby', ruby: 'ruby',
    go: 'go', golang: 'go',
    rs: 'rust', rust: 'rust',
    java: 'java',
    kt: 'kotlin', kotlin: 'kotlin',
    c: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', h: 'cpp', hpp: 'cpp',
    cs: 'csharp', csharp: 'csharp',
    sh: 'shell', bash: 'shell', zsh: 'shell', shell: 'shell',
    ps1: 'powershell', psm1: 'powershell', psd1: 'powershell', powershell: 'powershell', pwsh: 'powershell',
    bat: 'bat', cmd: 'bat',
    json: 'json', jsonc: 'json', yaml: 'yaml', yml: 'yaml', toml: 'ini', ini: 'ini', cfg: 'ini', conf: 'ini',
    sql: 'sql',
    html: 'html', htm: 'html', xml: 'xml', svg: 'xml',
    css: 'css', scss: 'scss', sass: 'scss', less: 'less',
    md: 'markdown', markdown: 'markdown',
    lua: 'lua', php: 'php', swift: 'swift', dart: 'dart',
    r: 'r', scala: 'scala', vb: 'vb', perl: 'perl', pl: 'perl',
    dockerfile: 'dockerfile', makefile: 'makefile', graphql: 'graphql', gql: 'graphql',
  };

  static languageFor(label) {
    let key = String(label || '').toLowerCase().trim();
    if (key.includes('.')) key = key.split('.').pop().trim();
    return Object.prototype.hasOwnProperty.call(MonacoLanguages.MAP, key) ? MonacoLanguages.MAP[key] : 'plaintext';
  }

  static resolveLanguage(language, name) {
    const lang = MonacoLanguages.languageFor(language);
    if (lang !== 'plaintext') return lang;
    return name ? MonacoLanguages.languageFor(name) : 'plaintext';
  }
}
