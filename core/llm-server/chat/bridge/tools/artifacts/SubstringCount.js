class SubstringCount {
  static count(haystack, needle) {
    if (!needle) return 0;
    let n = 0;
    let from = 0;
    for (;;) {
      const i = haystack.indexOf(needle, from);
      if (i === -1) return n;
      n++;
      from = i + needle.length;
    }
  }
}

module.exports = SubstringCount;
