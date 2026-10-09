class CallRefusalText {
  static MALFORMED_CALL = 'Your previous message looked like a tool call but was not valid and could not be run. '
    + 'Emit the call EXACTLY in this shape: a ```tool fenced block with valid JSON using the "tool" '
    + 'and "params" keys:\n```tool\n{"tool": "<tool_name>", "params": { /* arguments */ }}\n```\n'
    + 'Use one of the available tools and try again.';

  static TRUNCATION_WARNING = 'WARNING: the JSON for this call was cut off mid-generation and had to be '
    + 'auto-repaired, so its arguments may be INCOMPLETE: any long value (file content, html, a body '
    + 'of text) was likely truncated at the cut. Read back what you just wrote and verify it. If it is '
    + 'short, rewrite it in smaller pieces rather than one large call.';

  static argumentsUnreadable(name, raw) {
    return `The arguments for this ${name} call were not valid JSON, so NOTHING was passed to the `
      + 'tool and it was not run (running it with no arguments would have searched everything and '
      + 'looked like a real answer). The usual cause is a backslash inside a JSON string: a regex '
      + 'like \\s or \\d, or a Windows path, must be written with a DOUBLE backslash (\\\\s, \\\\d, '
      + `C:\\\\Users). Re-send the call with the arguments escaped.\n\nWhat was received: ${raw}`;
  }

  static argumentsCutOff(name) {
    return `Your reply hit its token limit BEFORE the arguments of this ${name} call were `
      + 'generated, so the call arrived empty and was NOT run. This usually means too much '
      + 'of the reply was spent before the call. Re-issue the call now: keep any reasoning '
      + 'brief, emit the tool call immediately, and if its payload is large, split the work '
      + 'across several smaller calls.';
  }

  static refusedTruncatedCall(name) {
    return `The JSON for this ${name} call was cut off mid-generation, so its arguments were `
      + 'incomplete; most likely the long one (file content, html, a body of text) was severed at '
      + 'the cut. NOTHING was written: running it would have overwritten the target with a fragment. '
      + 'Re-send the call, splitting the content across several smaller calls (write the first '
      + 'section, then append the rest with edit_file) so no single call is large enough to be cut.';
  }

  static withTruncationWarning(res) {
    if (!res || res.success === false) return res;
    return {
      ...res,
      truncatedArgs: true,
      message: res.message ? `${res.message}\n\n${CallRefusalText.TRUNCATION_WARNING}` : CallRefusalText.TRUNCATION_WARNING,
    };
  }
}

module.exports = CallRefusalText;
