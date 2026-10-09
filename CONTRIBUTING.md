# Contributing to LumaBrowser

Thanks for helping. Two things before a pull request can be merged: the
Contributor License Agreement below, and the project's coding conventions.

## Contributor License Agreement

LumaBrowser is released under the AGPL-3.0-or-later and also under a
commercial license from Lumabyte, LLC (see
[COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md)). Offering both requires that
Lumabyte holds the rights to relicense every contribution, so every
contributor signs the agreement below once. A pull request from an unsigned
contributor is held by the CLA check until they sign by commenting on it:

```
I have read the CLA Document and I hereby sign the CLA
```

The signature is recorded on the `cla-signatures` branch of this repository
and applies to all your later pull requests.

### Agreement

By signing, you ("You") agree to the following terms for any contribution
You submit to LumaBrowser ("the Project"), which is maintained by Lumabyte,
LLC ("Lumabyte").

1. **Definitions.** "Contribution" means any original work of authorship,
   including modifications or additions to existing work, that You
   intentionally submit to the Project in any form (pull request, patch,
   issue attachment, or otherwise).
2. **Copyright license.** You grant Lumabyte a perpetual, worldwide,
   non-exclusive, royalty-free, irrevocable copyright license to reproduce,
   prepare derivative works of, publicly display, publicly perform,
   sublicense and distribute Your Contribution and such derivative works,
   under any license, including the AGPL and Lumabyte's commercial license.
3. **Patent license.** You grant Lumabyte and recipients of software
   distributed by Lumabyte a perpetual, worldwide, non-exclusive,
   royalty-free, irrevocable patent license to make, have made, use, sell,
   offer to sell, import and otherwise transfer Your Contribution, for any
   patent claims You own that are necessarily infringed by Your Contribution
   alone or in combination with the Project.
4. **You keep your rights.** You retain ownership of Your Contribution and
   may use and license it however You like. This agreement is a license, not
   an assignment.
5. **Representations.** You represent that You are legally entitled to grant
   these licenses; that each Contribution is Your original creation, or that
   You have identified any third-party material and its license in the
   Contribution; and that, if Your employer has rights to intellectual
   property You create, You have permission to make the Contribution on its
   behalf or the employer has waived such rights.
6. **No warranty.** Except for the representations above, Your Contribution
   is provided as is, without warranties of any kind.
7. **Notice.** You agree to tell Lumabyte if You become aware of any fact
   that would make these representations inaccurate.

## Conventions

- Read [Documentation/index.md](Documentation/index.md) first. Every code
  file has a matching page under `Documentation/` and a line in the index;
  keep both current.
- The coding conventions are in
  [Documentation/Porting/PortingGuide.md](Documentation/Porting/PortingGuide.md).
  Files must not contain em-dash or en-dash characters.
- Run the unit suite with `npm run test:node -- <paths>` while working and
  `npm test` before opening the pull request.
- Keep pull requests to one area; cross-area requests go through
  [Documentation/Porting/ChangeRequests.md](Documentation/Porting/ChangeRequests.md).
