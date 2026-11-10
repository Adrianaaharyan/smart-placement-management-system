# Contributing

Thanks for helping improve PlaceIQ. There is no build step and no dependencies, so setup takes a minute.

## Run it

```bash
npm start            # http://localhost:3000
npm test             # unit tests (Node 18 or newer)
```

The browser smoke test needs Playwright once:

```bash
pip install playwright && python -m playwright install chromium
npm run test:e2e
```

## Where things go

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) first. The short version:

- **Rules and calculations** go in `js/core/`, as pure functions with no DOM access, with a unit test in `tests/unit/`.
- **Constants and weights** go in `js/config.js`. **Content** (figures, drives, questions) goes in `js/data/`.
- **A new tab** is a new module in `js/views/` that returns an HTML string, plus a route in `js/config.js` (`VIEWS`), `js/app.js` and the nav in `index.html`.
- **User interaction** is added to `js/events.js` through a `data-act` attribute, not by attaching listeners inside a view.
- **Colours and fonts** are tokens in `css/tokens.css`. Do not use a literal colour in a component rule; both the light and dark themes must keep working.

## Before opening a pull request

1. `npm test` passes.
2. `npm run test:e2e` passes.
3. Any user-supplied text put into HTML goes through `esc()`.
4. If you changed the shape of the saved state, bump `STORAGE_KEY` in `js/config.js`.
5. If you changed a number in `js/data/official.js`, say which source it came from in the pull request.
6. Do not commit real student records.

## Style

Two-space indentation, double quotes, semicolons, ES modules, no framework. `.editorconfig` covers the basics.
