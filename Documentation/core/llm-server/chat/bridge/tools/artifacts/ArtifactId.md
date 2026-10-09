# ArtifactId

`core/llm-server/chat/bridge/tools/artifacts/ArtifactId.js`

Reads the artifact id every artifact-taking tool needs.

## Methods (all static)

- `from(params)`: `artifactId`, `artifact_id`, `id` or `imageId`, else undefined.

## Why

Small models emit the wrong key; one alias list keeps `{"id": ...}` working on
every tool instead of some.
