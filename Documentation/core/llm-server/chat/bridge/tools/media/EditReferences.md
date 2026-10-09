# EditReferences

`core/llm-server/chat/bridge/tools/media/EditReferences.js`

Resolves edit_image's extra reference images to their bytes.

## Methods (all static)

- `resolve({ params, artifactStore, sourceId, max = MAX })`: entries from
  `references`, `referenceArtifactIds` or `reference_artifact_ids` (an id or
  `{ artifactId, use|role|for }`); the source and repeats are skipped, entries
  past `max` counted as `dropped`. Returns `{ refs: [{ id, use, content }],
  dropped, error? }`; a missing, non-image or empty artifact is an error.
- `MAX` (`EditProfiles.DEFAULT_MAX_REFERENCES`), `MAX_USE_CHARS` (80).
