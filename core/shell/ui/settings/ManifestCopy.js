export default class ManifestCopy {
  static EM_DASH = String.fromCharCode(0x2014);

  static EN_DASH = String.fromCharCode(0x2013);

  static EM_DASH_RUN = new RegExp(`\\s*${ManifestCopy.EM_DASH}\\s*`, 'g');

  static EN_DASH_ALL = new RegExp(ManifestCopy.EN_DASH, 'g');

  static BACK_ICON = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  static clean(text) {
    return String(text == null ? '' : text)
      .replace(ManifestCopy.EM_DASH_RUN, ': ')
      .replace(ManifestCopy.EN_DASH_ALL, '-');
  }
}
