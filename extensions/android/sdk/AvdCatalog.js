const fs = require('fs');
const path = require('path');
const IniFile = require('./IniFile');

class AvdCatalog {
  static NAME_RULE = /^[A-Za-z0-9_.-]{1,60}$/;
  static NEW_NAME = 'Luma_Phone';
  static HARDWARE = {
    'hw.cpu.ncore': 4, 'hw.ramSize': 2048, 'hw.lcd.width': 1080, 'hw.lcd.height': 2400, 'hw.lcd.density': 420,
    'hw.keyboard': 'yes', 'hw.gpu.enabled': 'yes', 'disk.dataPartition.size': '6G',
  };

  constructor(avdHome, { fileSystem = fs } = {}) {
    this._home = avdHome;
    this._fs = fileSystem;
  }

  list() {
    let files;
    try { files = this._fs.readdirSync(this._home); } catch (_) { return []; }
    return files.filter((file) => file.endsWith('.ini')).map((file) => this._read(file)).filter(Boolean);
  }

  has(name) {
    return this.list().some((device) => device.name === name);
  }

  freeName() {
    const taken = new Set(this.list().map((device) => device.name));
    for (let number = 1; ; number += 1) {
      const name = number === 1 ? AvdCatalog.NEW_NAME : `${AvdCatalog.NEW_NAME}_${number}`;
      if (!taken.has(name)) return name;
    }
  }

  create({ name, image }) {
    if (!AvdCatalog.NAME_RULE.test(String(name || ''))) throw new Error('A device name can hold letters, digits, dots, dashes and underscores');
    if (this.has(name)) throw new Error(`A device named ${name} already exists`);
    const folder = path.join(this._home, `${name}.avd`);
    this._fs.mkdirSync(folder, { recursive: true });
    this._fs.writeFileSync(path.join(folder, 'config.ini'), IniFile.format(AvdCatalog._config(name, image)));
    this._fs.writeFileSync(path.join(this._home, `${name}.ini`), IniFile.format({
      'avd.ini.encoding': 'UTF-8', path: folder, 'path.rel': `avd${path.sep}${name}.avd`, target: image.target,
    }));
    return this.list().find((device) => device.name === name);
  }

  static _config(name, image) {
    return {
      AvdId: name,
      'avd.ini.displayname': name.replace(/_/g, ' '),
      'PlayStore.enabled': image.playStore ? 'true' : 'false',
      'abi.type': image.abi,
      'hw.cpu.arch': image.abi,
      ...AvdCatalog.HARDWARE,
      'image.sysdir.1': image.sysdir,
      'tag.id': image.tag,
      target: image.target,
    };
  }

  _read(iniFile) {
    const name = iniFile.slice(0, -'.ini'.length);
    try {
      const pointer = IniFile.parse(this._fs.readFileSync(path.join(this._home, iniFile), 'utf8'));
      const folder = pointer.path || path.join(this._home, `${name}.avd`);
      const config = IniFile.parse(this._fs.readFileSync(path.join(folder, 'config.ini'), 'utf8'));
      return {
        name,
        label: config['avd.ini.displayname'] || name,
        target: config.target || pointer.target || '',
        playStore: config['PlayStore.enabled'] === 'true',
      };
    } catch (_) {
      return null;
    }
  }
}

module.exports = AvdCatalog;
