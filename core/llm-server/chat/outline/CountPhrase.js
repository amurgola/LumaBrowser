class CountPhrase {
  static of(count, singular, plural = `${singular}s`) {
    return `${count} ${CountPhrase.noun(count, singular, plural)}`;
  }

  static noun(count, singular, plural = `${singular}s`) {
    return count === 1 ? singular : plural;
  }
}

module.exports = CountPhrase;
