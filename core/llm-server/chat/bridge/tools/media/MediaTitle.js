class MediaTitle {
  static PROMPT_CHARS = 60;

  static from(params, prompt) {
    return (params && params.title && String(params.title).trim()) || prompt.slice(0, MediaTitle.PROMPT_CHARS);
  }
}

module.exports = MediaTitle;
