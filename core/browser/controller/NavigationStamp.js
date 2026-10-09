class NavigationStamp {
  static apply(data, result) {
    if (!result || !result.urlChanged) return data;
    data.urlChanged = true;
    data.newUrl = result.newUrl;
    return data;
  }
}

module.exports = NavigationStamp;
