import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class TestListView {
  static EMPTY_HTML = '<div class="th-empty">No tests found. Add .test.js files in extensions/&lt;ext&gt;/tests/</div>';

  static render(tests) {
    if (!tests.length) return TestListView.EMPTY_HTML;
    let html = '';
    for (const [suite, suiteTests] of Object.entries(TestListView._bySuite(tests))) {
      for (const test of suiteTests) html += TestListView._row(suite, test);
    }
    return html;
  }

  static _bySuite(tests) {
    const suites = {};
    for (const test of tests) {
      if (!suites[test.suite]) suites[test.suite] = [];
      suites[test.suite].push(test);
    }
    return suites;
  }

  static _row(suite, test) {
    const esc = HtmlEscaper.escape;
    const variants = test.variants || [];
    return `
            <div class="th-test-item">
              <span class="th-test-suite">${esc(suite)}</span>
              <span class="th-test-name">${esc(test.name)}</span>
              <div class="th-test-variants">
                ${variants.length > 0 ? variants.map((v) => TestListView._variantButton(test, v)).join('') : TestListView._runButton(test)}
              </div>
            </div>`;
  }

  static _variantButton(test, variant) {
    const esc = HtmlEscaper.escape;
    return `
                    <button class="luma-btn luma-btn--sm th-run-test-btn"
                            data-test-id="${esc(test.id)}"
                            data-variant-id="${esc(variant.id)}"
                            title="Run: ${esc(variant.label)}">
                      ${esc(variant.label)}
                    </button>
                  `;
  }

  static _runButton(test) {
    return `<button class="luma-btn luma-btn--sm primary th-run-test-btn"
                             data-test-id="${HtmlEscaper.escape(test.id)}"
                             data-variant-id="">
                      Run
                    </button>`;
  }
}
