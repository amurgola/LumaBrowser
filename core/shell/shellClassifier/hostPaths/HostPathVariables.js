const ShellWords = require('../ShellWords');

class HostPathVariables {
  static LOCATIONS = Object.freeze({
    home: '~',
    userprofile: '~',
    homepath: '~',
    systemroot: 'C:/Windows',
    windir: 'C:/Windows',
    systemdrive: 'C:',
    homedrive: 'C:',
    programfiles: 'C:/Program Files',
    programw6432: 'C:/Program Files',
    'programfiles(x86)': 'C:/Program Files (x86)',
    programdata: 'C:/ProgramData',
    allusersprofile: 'C:/ProgramData',
  });

  static HOME_PAIR = /(%homedrive%|\$env:homedrive|\$\{env:homedrive\})(%homepath%|\$env:homepath|\$\{env:homepath\})/gi;

  static SPELLINGS = Object.freeze([
    /\$\{env:([A-Za-z_][\w()]*)\}/gi,
    /\$env:([A-Za-z_]\w*)/gi,
    /%([A-Za-z_][\w()]*)%/g,
    /\$\{([A-Za-z_]\w*)\}/g,
    /\$([A-Za-z_]\w*)/g,
  ]);

  static expand(text) {
    const paired = String(text).replace(HostPathVariables.HOME_PAIR, '~');
    return HostPathVariables.SPELLINGS.reduce((out, pattern) => out.replace(pattern, HostPathVariables._substitute), paired);
  }

  static locationOf(variableName) {
    const key = ShellWords.lower(variableName);
    return Object.hasOwn(HostPathVariables.LOCATIONS, key) ? HostPathVariables.LOCATIONS[key] : null;
  }

  static _substitute(match, variableName) {
    return HostPathVariables.locationOf(variableName) ?? match;
  }
}

module.exports = HostPathVariables;
