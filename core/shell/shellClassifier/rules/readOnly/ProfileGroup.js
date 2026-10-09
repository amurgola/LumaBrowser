class ProfileGroup {
  static profiles() {
    throw new Error(`${this.name} must implement static profiles()`);
  }
}

module.exports = ProfileGroup;
