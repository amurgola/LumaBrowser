class AssetLedger {
  static MAX_RETRIES = 3;

  static canRetry(data, key) {
    const retry = (data && data.assetRetry) || {};
    return (retry[key] || 0) < AssetLedger.MAX_RETRIES;
  }

  static noteFail(data, key) {
    data.assetRetry = Object.assign({}, data.assetRetry || {});
    data.assetRetry[key] = (data.assetRetry[key] || 0) + 1;
  }

  static noteOk(data, key) {
    if (!(data.assetRetry && data.assetRetry[key])) return false;
    data.assetRetry = Object.assign({}, data.assetRetry);
    delete data.assetRetry[key];
    return true;
  }
}

module.exports = AssetLedger;
