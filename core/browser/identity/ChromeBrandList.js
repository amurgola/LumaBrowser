class ChromeBrandList {
  static GREASEY_CHARS = [' ', '(', ':', '-', '.', '/', ')', ';', '=', '?', '_'];
  static GREASED_VERSIONS = ['8', '99', '24'];
  static ORDERS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];

  static build(seed, version, greaseVersionSuffix) {
    const list = [
      ChromeBrandList._greaseBrand(seed, greaseVersionSuffix),
      { brand: 'Chromium', version },
      { brand: 'Google Chrome', version },
    ];
    return ChromeBrandList._shuffle(list, ChromeBrandList.ORDERS[seed % ChromeBrandList.ORDERS.length]);
  }

  static toHeader(list) {
    return list.map((b) => `"${b.brand}";v="${b.version}"`).join(', ');
  }

  static _greaseBrand(seed, greaseVersionSuffix) {
    const chars = ChromeBrandList.GREASEY_CHARS;
    const versions = ChromeBrandList.GREASED_VERSIONS;
    return {
      brand: `Not${chars[seed % chars.length]}A${chars[(seed + 1) % chars.length]}Brand`,
      version: versions[seed % versions.length] + greaseVersionSuffix,
    };
  }

  static _shuffle(list, order) {
    const shuffled = new Array(list.length);
    list.forEach((entry, i) => { shuffled[order[i]] = entry; });
    return shuffled;
  }
}

module.exports = ChromeBrandList;
