class MultipartForm {
  static BOUNDARY_PREFIX = '----LumaVoice';

  static build(fields, file) {
    const boundary = MultipartForm.BOUNDARY_PREFIX + Math.random().toString(36).slice(2);
    const parts = Object.entries(fields || {}).map(([name, value]) => MultipartForm._fieldPart(boundary, name, value));
    parts.push(MultipartForm._fileHeader(boundary, file));
    parts.push(Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data));
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'));
    return { buffer: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
  }

  static _fieldPart(boundary, name, value) {
    return Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`, 'utf8');
  }

  static _fileHeader(boundary, file) {
    return Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\n`
      + `Content-Type: ${file.type}\r\n\r\n`,
      'utf8',
    );
  }
}

module.exports = MultipartForm;
