# El Foundry de la Banda — Technical Overview

Responsive companion web for six tabletop RPG character sheets, with independent desktop and mobile experiences, temporary session state, optional remote synchronization and fail-closed authentication.

[Documentación operativa en español](README.md) · [Technical case study](https://jrrguille-bit.github.io/guillermo-barbeito-it/en/projects/foundry/)

## What this project demonstrates

- Modeling and presentation of complex Foundry VTT actor exports.
- Independent desktop and mobile application layers.
- Per-character session state with a renewable TTL, migrations, subscriptions and explicit reset.
- Optional remote synchronization through Google Sheets and Google Apps Script.
- Fail-closed authentication: without a valid private credential, the client stays in local mode.
- Presentation-layer localization that preserves canonical IDs and game mechanics.
- Automated QA across mobile logic, real browser engines, session state, remote sync, Apps Script security and spell localization.

## Architecture

- **Canonical data:** six audited static actor exports with stable character IDs.
- **Desktop:** original renderer backed by the canonical bundle.
- **Mobile:** independent full-screen interface with combat, spells, equipment, features and session controls.
- **Local state:** one temporary store per character with a renewable five-hour TTL.
- **Remote state:** authenticated Google Apps Script backend with Google Sheets storage.
- **Security:** sensitive reads and writes use authenticated POST requests; the public client defaults to remote sync disabled.
- **Localization:** Spanish defaults for Magna and Melkor, English defaults for the other four characters, with English fallback.

## Stack

JavaScript · HTML · CSS · Google Apps Script · Google Sheets · Playwright · GitHub Actions

## Verification

The repository includes dedicated QA suites for:

- mobile behavior;
- Chromium and WebKit browser flows;
- session-store behavior;
- remote synchronization;
- Apps Script backend security;
- spell localization.

Historical project records document 633 successful spell-localization checks and 51 successful Apps Script backend security checks for the corresponding implementation stages.

## Current status

- Six character sheets with audited static data.
- Functional desktop and mobile interfaces.
- Secure remote backend deployed and referenced by `main`.
- Final credential rotation and authorized/unauthorized browser verification remain tracked in issue #69.
- No open pull requests as of August 11, 2026.
- Future GM-to-player interaction remains in backburner issue #26.

## Security boundary

No access token, private Google Sheet URL or account credential belongs in this public repository. The public Apps Script deployment URL is not treated as a secret; security depends on the private access token and fail-closed client behavior.

## Operational documentation

The Spanish [README](README.md), [AGENTS.md](AGENTS.md), [first-run guide](00-START-HERE-GONZA.md) and [handoff](docs/handoff-gonza-codex.md) are the canonical operational references for future maintenance sessions.

## Author

**Guillermo Barbeito** — Computer Engineer focused on IT Support, Product Support and Technical Operations.

- GitHub: https://github.com/JRRGUILLE-bit
- LinkedIn: https://www.linkedin.com/in/guillermo-barbeito-040632340/
- IT portfolio: https://jrrguille-bit.github.io/guillermo-barbeito-it/en/
