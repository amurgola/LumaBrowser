export default class BootLog {
  static _origin = null;

  static log(label) {
    console.log(`[luma-boot +${Date.now() - BootLog.origin()}ms] renderer: ${label}`);
  }

  static origin() {
    if (BootLog._origin == null) BootLog._origin = window.__LUMA_BOOT_START || Date.now();
    return BootLog._origin;
  }
}
