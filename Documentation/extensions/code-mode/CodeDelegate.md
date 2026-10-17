# CodeDelegate

`extensions/code-mode/CodeDelegate.js`

The Code mode's delegation targets for the chat's `delegate_task`
([DelegationTools](../../core/llm-server/chat/delegation/DelegationTools.md)).
Each start yields the setup the Vibe and "Code a project" buttons persist, plus
a first message in the words [CodeKickoff](ui/CodeKickoff.md) sends (that file
is the renderer's ES module, so main cannot import it).

## Methods

- `CodeDelegate.TARGETS`:
  - `build-extension` ("Code: build a LumaBrowser extension"; params `task`
    required, `name`);
  - `code-project` ("Code: work on a project folder"; params `projectPath` and
    `task`, both required).
- `CodeDelegate.spec(fsImpl = fs)` returns `{ targets, start({ targetId, args }) }`,
  the descriptor's `delegate` block.
- `CodeDelegate.start(targetId, args, fsImpl)`:
  - build: `{ data: { kind: 'build', task, name? }, message: "Build this
    LumaBrowser extension: <task>" plus the write and install instructions,
    title: name or task }`;
  - project: `{ error }` without `projectPath` or when it is not a directory,
    else `{ data: { kind: 'project', projectPath, task }, message: "Work on the
    project at <path>. Task: ...", title: task }`.
