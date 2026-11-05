# Security Policy

## Supported Versions

Liaotao is in early development and has no release yet. Security fixes go to `main`.
Once releases exist, only the latest one will be supported.

## Reporting a Vulnerability

Please **do not open a public GitHub issue**. Either way is fine:

- **Email:** support@auricacircular.com
- **GitHub:** open a private security advisory —
  `Security → Advisories → New draft security advisory`

Include a description, steps to reproduce, and the potential impact.

## How Liaotao handles secrets

- API keys are stored where the user chooses: the settings file in the OS configuration
  directory, readable by the user's account only (mode `600`), or the OS keychain.
- A saved key is never sent to the interface, never logged, and never written to the
  project folder.
- `./verify.sh` rejects commits containing common secret formats or personal paths.
