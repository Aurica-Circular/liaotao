# Contributing to Liaotao

Thanks for your interest in Liaotao. Contributions are welcome — bug reports, fixes,
documentation, translations, test cases.

## Before you start

- **Open an issue first** for anything larger than a bug fix. It saves you from building
  something the project does not want, and it saves the maintainer from reviewing it.
- Documentation inside this repository is written in **English**.

## Licence and sign-off

Liaotao is licensed under the [Apache License 2.0](LICENSE). As stated in section 5 of
that licence, any contribution you submit is made under the same terms. **You keep the
copyright on what you wrote.**

Each commit must be signed off to certify the
[Developer Certificate of Origin 1.1](https://developercertificate.org/) — in short: you
wrote the code, or you have the right to submit it under the project's licence.

```
git commit -s -m "fix: keep the stop button responsive during streaming"
```

which appends:

```
Signed-off-by: Your Name <your.email@example.com>
```

A check runs on every pull request and reports any commit that is not signed off, with
the command to fix it. A bug report or a reproduction case is a valuable contribution
too, and needs no sign-off.

## Pull request checklist

- [ ] Commits are signed off (`git commit -s`)
- [ ] The application builds (`npm run build` and `cargo build` in `src-tauri/`)
- [ ] The pull request describes *why*, not only *what*
