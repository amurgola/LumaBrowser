class NavigationReply {
  static build(data, preUrl, postUrl) {
    if (postUrl !== preUrl) return { success: true, data, urlChanged: true, newUrl: postUrl };
    return { success: true, data };
  }
}

module.exports = NavigationReply;
