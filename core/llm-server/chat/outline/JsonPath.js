class JsonPath {
  static ROOT = '$';
  static IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

  static child(path, key) {
    return JsonPath.IDENTIFIER.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
  }

  static everyElement(path) {
    return `${path}[*]`;
  }
}

module.exports = JsonPath;
