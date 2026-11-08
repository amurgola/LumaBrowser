# BodySignals

`extensions/roleplay-mode/grounding/BodySignals.js`

Turns the numbers in a character's description into synthetic tags the body
cards key on, for what a word match cannot catch.

## Methods

- `BodySignals.tags(text)` -> lowercase tags: an age band (`agetoddler` 1 to
  3, `ageyoungchild` 4 to 7, `agechild` 8 to 12, `ageteen` 13 to 17,
  `ageolder` 60 to 74, `ageadvanced` 75 and up) and, for anyone 16 or older or
  of unstated age, a height band (`sizeverytall` at 195 cm and up, `sizeshort`
  at 155 cm and under).
- `age(lowercaseText)` from "78 year old", "nine-year-old", "aged 9", "age 9"
  or "in her late seventies"; null when none is stated.
- `ageBand(age)`, `heightCm(lowercaseText)` from "201 cm", "2.01 m", `6'7"` or
  "6 ft 7".
