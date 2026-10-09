# EchoedLookupCheck

`core/llm-server/chat/tool-loop/EchoedLookupCheck.js`

Holds back a lookup whose answer the run already has. Extends
[LoopCheck](LoopCheck.md).

## Methods

- `inspectRequest(record, history)`: for [LookupTools](LookupTools.md), held
  when an earlier successful call has the same signature
  (`{ earlierStep, reworded: false }`), or when an earlier successful search
  on the same tool resembles it by at least `RESEMBLANCE_BAR`
  (`{ earlierStep, reworded: true, earlierQuery }`).
- `PATTERN` = `echoed-lookup`; `RESEMBLANCE_BAR` = 0.8.

## Why

Within one turn a lookup's answer is fixed, so repeating it only costs a step
and context. Failed lookups are never echoes, so a retry is fine. At 0.8, these
count as the same question: reordering, case, filler words, plurals, or one
added word on a four-word query. Swapping a content word in a short query
scores 0.5 or less and counts as a new search. Document-dedup work uses higher
bars (about 0.9), but short queries change more per word.
