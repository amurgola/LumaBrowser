export default class FileBase64 {
  static read(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ b64: FileBase64._stripPrefix(String(reader.result || '')), mime: file.type || 'image/png' });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  static _stripPrefix(dataUrl) {
    const comma = dataUrl.indexOf(',');
    return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  }
}
