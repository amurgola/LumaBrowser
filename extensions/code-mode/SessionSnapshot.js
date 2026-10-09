class SessionSnapshot {
  static build(s) {
    return {
      id: s.id,
      dir: s.dir || null,
      status: s.status || 'drafting',
      installedId: s.installedId || null,
      files: SessionSnapshot._files(s),
    };
  }

  static project(s) {
    return { id: s.id, kind: 'project', status: s.status || 'editing', files: SessionSnapshot._files(s) };
  }

  static forConversation(sessions, conversationId) {
    const s = sessions.get(conversationId);
    if (!s || !s.workspaceId) return null;
    return s.kind === 'project' ? SessionSnapshot.project(s) : SessionSnapshot.build(s);
  }

  static emit(emit, type, payload) {
    if (typeof emit !== 'function') return;
    try { emit({ type, payload }); } catch (_) {}
  }

  static _files(s) {
    return [...s.files.entries()].map(([path, v]) => ({
      path,
      ok: !!(v && v.ok),
      phase: (v && v.phase) || 'done',
    }));
  }
}

module.exports = SessionSnapshot;
