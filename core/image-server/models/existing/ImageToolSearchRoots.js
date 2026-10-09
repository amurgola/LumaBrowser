const fs = require('fs');
const path = require('path');
const ImageLibraryFs = require('./ImageLibraryFs');

class ImageToolSearchRoots {
  static HOME_SUBFOLDERS = ['Documents', 'Desktop', 'Downloads', path.join('OneDrive', 'Documents'), 'AI', 'ai', 'comfy'];

  static BASE_PATH_RE = /^\s*base_path:\s*["']?([^"'#\r\n]+?)["']?\s*$/gm;

  static searchParents() {
    const out = [...ImageToolSearchRoots._homeParents(), ...ImageToolSearchRoots._driveParents()];
    return out.filter(ImageLibraryFs.isDir);
  }

  static stabilityMatrixRoots(env) {
    const out = [];
    if (env && env.APPDATA) out.push(path.join(env.APPDATA, 'StabilityMatrix'));
    const home = ImageLibraryFs.homedir();
    if (home && process.platform !== 'win32') out.push(path.join(home, '.config', 'StabilityMatrix'));
    return out.filter(ImageLibraryFs.isDir);
  }

  static comfyConfiguredRoots(env, installDirs) {
    const configDirs = ImageToolSearchRoots._comfyConfigDirs(env);
    const yamlFiles = installDirs.map((d) => path.join(d, 'extra_model_paths.yaml'))
      .concat(configDirs.map((d) => path.join(d, 'extra_models_config.yaml')));
    const out = [
      ...configDirs.map(ImageToolSearchRoots._desktopBasePath).filter(Boolean),
      ...yamlFiles.flatMap(ImageToolSearchRoots._yamlBasePaths),
    ];
    return out.filter(ImageLibraryFs.isDir);
  }

  static _homeParents() {
    const home = ImageLibraryFs.homedir();
    if (!home) return [];
    return [home, ...ImageToolSearchRoots.HOME_SUBFOLDERS.map((sub) => path.join(home, sub))];
  }

  static _driveParents() {
    if (process.platform !== 'win32') return [];
    const out = [];
    for (let code = 67; code <= 90; code++) {
      const root = `${String.fromCharCode(code)}:\\`;
      if (!ImageLibraryFs.isDir(root)) continue;
      out.push(root, path.join(root, 'AI'), path.join(root, 'StableDiffusion'), path.join(root, 'SD'));
    }
    return out;
  }

  static _comfyConfigDirs(env) {
    const dirs = [];
    if (env && env.APPDATA) dirs.push(path.join(env.APPDATA, 'ComfyUI'));
    const home = ImageLibraryFs.homedir();
    if (home && process.platform === 'darwin') dirs.push(path.join(home, 'Library', 'Application Support', 'ComfyUI'));
    return dirs;
  }

  static _desktopBasePath(configDir) {
    try {
      const cfg = JSON.parse(fs.readFileSync(path.join(configDir, 'config.json'), 'utf8'));
      return cfg && typeof cfg.basePath === 'string' ? cfg.basePath : null;
    } catch (_) {
      return null;
    }
  }

  static _yamlBasePaths(yamlFile) {
    let text;
    try {
      text = fs.readFileSync(yamlFile, 'utf8');
    } catch (_) {
      return [];
    }
    const re = new RegExp(ImageToolSearchRoots.BASE_PATH_RE.source, 'gm');
    const out = [];
    let match;
    while ((match = re.exec(text))) {
      const p = match[1].trim();
      if (p) out.push(path.isAbsolute(p) ? p : path.resolve(path.dirname(yamlFile), p));
    }
    return out;
  }
}

module.exports = ImageToolSearchRoots;
