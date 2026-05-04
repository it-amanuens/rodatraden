# Contributing to Rödatråden

Welcome!

This project is built **for and by Teknisk Fysik in Umeå**. While our main focus is our own program, **external contributions and forks are absolutely welcome**. If you fork or reuse this work, please clearly state and link back to the original project, and make sure contributors are credited.

## How to Contribute

- **Open an Issue first** for bug reports, feature requests, or large changes. This lets us discuss scope before you spend time on it <kcite ref="5"/>.
- **One logical change per pull request.** Smaller, focused PRs are easier to review and less likely to break things.
- **Test your changes locally** before submitting. If it doesn't work on your machine, it won't work in production.

## AI Use Policy

**AI-assisted contributions are permitted and encouraged.** We think AI is a great tool for checking the code you've written, catching mistakes, and "bolla med" (bouncing ideas around).

That said, it is not a replacement for understanding your work:

- **You must understand what you submit.** Use AI as a helpful tool, not a replacement for thinking.
- **Try out and verify all contributions** before committing. We do not want broken, untested AI slop code.
- **No vibe coding.** Blindly copy-pasting AI output without reading or comprehending it is not acceptable.
- **Please disclose AI use in your PR description** (e.g., add an `[AI-assisted]` tag) so reviewers know what to expect.

## Project Scope & Stability

We plan to keep using this project for a long time. To keep it maintainable:

- **Write general code when possible.** Contributions that only serve a single, unrelated study program might not be merged. The more reusable your solution, the better.
- **No unstable or beta code in production.** Changes must be reliable and well-tested before they reach the main branch.
- **Official APIs are welcome; unofficial scraping is restricted.** We have avoided direct integration with external sites like `antagning.se` or `umu.se` due to complexity and stability concerns. However, if an **official API** becomes available, we are open to using it.
  - **Unofficial APIs or web scraping** must never replace the existing manual tools for course creation. Any such integration must be **fully reversible** and exist only as an optional add-on.
  - We have not yet implemented external APIs, partly due to complexity. If you want to build an integration, creating a **separate repository** for course data that this project can consume would be accepted and even encouraged!

## Code Style

- **Comment your code** as you write. Explain the "why," not just the "what."
- **Keep it simple and readable.** Prefer straightforward, boring code over clever one-liners.
- Follow existing patterns in the codebase for consistency.

## Pull Request Process

1. Fork the repo and create a feature branch.
2. Make your changes, following the guidelines above.
3. Ensure everything runs and works locally.
4. Open a PR with a clear description of what changed and why.
5. Note any AI assistance directly in the PR description.

Thanks for helping make this project better!
