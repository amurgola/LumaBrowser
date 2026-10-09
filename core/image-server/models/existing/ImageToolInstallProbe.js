const path = require('path');
const ImageLibraryFs = require('./ImageLibraryFs');

class ImageToolInstallProbe {
  static TOOL_LABEL = {
    comfyui: 'ComfyUI',
    fooocus: 'Fooocus',
    a1111: 'Stable Diffusion WebUI',
    forge: 'Forge',
    sdnext: 'SD.Next',
    swarmui: 'SwarmUI',
    stabilitymatrix: 'Stability Matrix',
    folder: 'Chosen folder',
  };

  static labelFor(tool) {
    return ImageToolInstallProbe.TOOL_LABEL[tool] || tool;
  }

  static probe(dir) {
    const name = path.basename(dir);
    for (const base of [dir, path.join(dir, 'ComfyUI'), path.join(dir, 'webui'), path.join(dir, 'Data')]) {
      const install = ImageToolInstallProbe._probeBase(dir, base);
      if (install) return { ...install, name };
    }
    return null;
  }

  static plainFolder(dir) {
    return { tool: 'folder', dir, name: path.basename(dir), folders: [{ dir, allInOne: true }] };
  }

  static _probeBase(dir, base) {
    const models = ImageLibraryFs.firstDir(base, ['models', 'Models']);
    if (!models) return null;
    const found = { tool: null, folders: [] };
    ImageToolInstallProbe._addStabilityMatrix(models, found);
    ImageToolInstallProbe._addWebUi(models, dir, found);
    ImageToolInstallProbe._addComfy(models, dir, found);
    return found.tool ? { tool: found.tool, dir: base, folders: found.folders } : null;
  }

  static _addStabilityMatrix(models, found) {
    const sm = ImageLibraryFs.firstDir(models, ['StableDiffusion']);
    if (!sm) return;
    found.tool = 'stabilitymatrix';
    found.folders.push({ dir: sm, allInOne: true });
  }

  static _addWebUi(models, dir, found) {
    const webui = ImageLibraryFs.firstDir(models, ['Stable-diffusion', 'Stable-Diffusion', 'stable-diffusion']);
    if (!webui) return;
    found.tool = found.tool || ImageToolInstallProbe._webUiFlavour(dir);
    found.folders.push({ dir: webui, allInOne: true });
  }

  static _addComfy(models, dir, found) {
    const checkpoints = ImageLibraryFs.firstDir(models, ['checkpoints']);
    if (!checkpoints) return;
    found.tool = found.tool || (/fooocus/i.test(dir) ? 'fooocus' : 'comfyui');
    found.folders.push({ dir: checkpoints, allInOne: true });
    for (const sub of ['diffusion_models', 'unet']) {
      const p = ImageLibraryFs.firstDir(models, [sub]);
      if (p) found.folders.push({ dir: p, allInOne: false });
    }
  }

  static _webUiFlavour(dir) {
    if (/forge/i.test(dir)) return 'forge';
    if (/automatic|sd[-_.]?next/i.test(dir)) return 'sdnext';
    if (/swarm/i.test(dir)) return 'swarmui';
    return 'a1111';
  }
}

module.exports = ImageToolInstallProbe;
