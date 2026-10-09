export default class ToolLabels {
  static LABEL = {
    navigate: 'Navigate', create_tab: 'Open tab', get_tabs: 'List tabs',
    click: 'Click', fill_form: 'Fill form', press_key: 'Press key',
    observe_page: 'Scan page', type: 'Type',
    scroll: 'Scroll', get_source: 'Read page', screenshot: 'Screenshot',
    wait_for: 'Wait for', get_element: 'Inspect', extract_data: 'Extract data',
    select_option: 'Choose option', set_date: 'Set date', set_slider: 'Set slider',
    collect_list: 'Collect list',
    create_artifact: 'Create artifact',
    edit_artifact: 'Edit artifact',
    create_live_artifact: 'Live module',
    generate_image: 'Generate image',
    edit_image: 'Edit image',
    validate_code: 'Validate code',
    ask_user_takeover: 'Needs you',
    generate_asset: 'Generate asset',
    fetch_gamedev_doc: 'Fetch game-dev doc',
    test_ai_prompt: 'Test in-game AI prompt',
  };

  static RUNNING = {
    validate_code: 'Validating code…',
    create_artifact: 'Creating artifact…',
    edit_artifact: 'Editing artifact…',
    create_live_artifact: 'Building interactive module…',
    generate_image: 'Generating image…',
    edit_image: 'Editing image…',
    get_source: 'Reading page…',
    screenshot: 'Taking screenshot…',
    navigate: 'Navigating…',
    extract_data: 'Extracting data…',
    collect_list: 'Collecting list items…',
    select_option: 'Choosing option…',
    observe_page: 'Scanning page elements…',
    type: 'Typing…',
    ask_user_takeover: 'Waiting for you…',
    write_file: 'Writing file…',
    read_file: 'Reading file…',
    edit_file: 'Editing file…',
    list_dir: 'Listing files…',
    find: 'Finding files…',
    grep: 'Searching…',
    project_overview: 'Scanning the project…',
    run_command: 'Running command…',
    check_process: 'Checking process…',
    save_artifact: 'Saving artifact to the project…',
    generate_asset: 'Generating asset…',
    fetch_gamedev_doc: 'Fetching game-dev doc…',
    test_ai_prompt: 'Testing in-game AI prompt…',
  };

  static humanize(name) {
    const s = String(name || '').replace(/[_-]+/g, ' ').trim();
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  static labelOf(tool) {
    return ToolLabels.LABEL[tool] || ToolLabels.humanize(tool) || 'Tool';
  }

  static stepLabel(tc) {
    if (tc._pending && !tc.tool) return 'Preparing…';
    return ToolLabels.RUNNING[tc.tool] || (ToolLabels.labelOf(tc.tool) + '…');
  }

  static agentStepLabel(tool) {
    return ToolLabels.LABEL[tool] || tool || 'tool';
  }
}
