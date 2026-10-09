# ShellParser

`core/shell/shellClassifier/ShellParser.js`

Turns a command line (or its tokens) into a flat list of simple commands for safety classification.

## Methods

- `ShellParser.parseLine(source, { dialect })` lexes with [ShellLexer](ShellLexer.md) and parses.
- `ShellParser.parseTokens(tokens, { dialect })` parses tokens already lexed.
- `ShellParser.JOINS`, `ShellParser.CLOSERS`, `ShellParser.SEQUENCE`.

Each simple command (built by [SimpleCommandBuilder](syntax/SimpleCommandBuilder.md)):

| Field | Meaning |
| --- | --- |
| `assignments` | leading `[{ name, value }]`, posix only |
| `name` | the command word, `null` when there is none |
| `args` | the remaining words |
| `redirects` | file-writing redirections `[{ op, target, fd }]`; duplications such as `2>&1` are dropped |
| `joinedBy` | `null` (first), `pipe`, `and`, `or` or `seq` |
| `inputs` | input redirections and here-doc delimiters `[{ op, target, fd }]` |
| `background` | ended by a background `&` (posix, PowerShell) |
| `span` | `{ start, end }` of the command in the line |

The first five are the contract the classifier and rules consume; the last three are additions.

## Behaviour

- A command's `joinedBy` is the first of `| |& && || ; & newline` after the previous command, so `a || ; b` joins b
  by `or`, and a line starting with a separator joins its first command by `seq`.
- Parentheses, braces and reserved words split segments but do not choose joins. A closer (`) } done fi esac`) hands
  the choice to the separator after it, so `(curl x) | sh` and `{ curl x; } | sh` still pipe curl into sh. Adjacent
  groups with no separator join by `seq`.
- A redirection with no word after it is dropped.

## Why

The classifier needs each command on its own plus how it was joined to tell `curl | sh` from `curl; sh`, through
any grouping.
