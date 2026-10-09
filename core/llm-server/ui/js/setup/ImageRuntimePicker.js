export default class ImageRuntimePicker {
  static ORDER = ['sd-cpp-cuda12', 'sd-cpp-vulkan', 'sd-cpp-cpu'];

  static CPU_ID = 'sd-cpp-cpu';

  static pick(view) {
    const runtimes = (view && view.runtimes) || [];
    return ImageRuntimePicker._firstReady(runtimes)
      || ImageRuntimePicker._firstObtainable(runtimes)
      || runtimes.find((r) => r.id === ImageRuntimePicker.CPU_ID)
      || runtimes[0] || null;
  }

  static _firstReady(runtimes) {
    for (const id of ImageRuntimePicker.ORDER) {
      const r = runtimes.find((x) => x.id === id);
      if (r && r.hardware && r.hardware.ready && ImageRuntimePicker._obtainable(r)) return r;
    }
    return null;
  }

  static _firstObtainable(runtimes) {
    for (const id of ImageRuntimePicker.ORDER) {
      const r = runtimes.find((x) => x.id === id);
      if (r && r.assetSupported !== false) return r;
    }
    return null;
  }

  static _obtainable(r) {
    return !!r.installed || r.assetSupported !== false;
  }
}
