export default class SystemLibraries {
  static async problem(system) {
    if (!system || typeof system.checkSystemLibraries !== 'function') return null;
    let reply = null;
    try { reply = await system.checkSystemLibraries(); } catch (_) { return null; }
    const result = reply && (reply.result || reply);
    if (!result || result.ok !== false) return null;
    return result;
  }
}
