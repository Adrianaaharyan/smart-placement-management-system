# Architecture

PlaceIQ is a client-side single-page application written as native ES modules. It has no framework, no bundler and no runtime dependencies. Open `index.html` through any static server and it runs.

## Layers

```
index.html ──► js/main.js
                 │
                 ├── core/store.js        state (store.D data, store.UI view state), localStorage
                 ├── events.js            user interaction ──► mutates state ──► render()
                 └── app.js               render() + hash routing
                       │
                       └── views/*.js     state ──► HTML string, one module per tab
                             │
                             ├── ui/components.js, ui/dom.js     shared HTML builders and helpers
                             └── core/scoring.js, selectors.js   rules and queries
```

Dependencies point downwards only. `core/` never imports from `views/`, `ui/` or `events.js`, and none of its logic modules touch the DOM, which is why they can be unit tested in plain Node.

| Layer | Folder | Rule |
| --- | --- | --- |
| Data | `js/data/` | Plain exported constants. No logic. |
| Core | `js/core/` | Pure functions over plain objects, plus the store. No DOM. |
| UI helpers | `js/ui/` | Small HTML-string builders and DOM helpers. |
| Views | `js/views/` | One function per tab that returns an HTML string from the current state. |
| Wiring | `js/app.js`, `js/events.js`, `js/main.js` | Rendering, routing, and event handling. |

## State

`store.D` holds the data and is what gets saved:

| Field | Shape |
| --- | --- |
| `source` | `"sample"` or `"imported"`. Controls the sample-data banner. |
| `students[]` | `{ id, name, roll, branch, cgpa, backlogs, skills[], aptitude, projects, internships }` |
| `drives[]` | `{ id, company, role, ctc, minCgpa, maxBack, branches[], skills[], date, status }` |
| `apps[]` | `{ sid, did, stage }`, one per student-drive pair |
| `nextD` | Counter used to give new drives an id |

`store.UI` holds view state that is not saved: current tab, selections, filters and the running quiz round.

Nothing is stored that can be derived. Placement status, best offer, readiness and match scores are computed from `students`, `drives` and `apps` whenever they are needed, so a stage change in one place is reflected everywhere.

## Rendering

Each view builds an HTML string and `render()` writes it into `#view`. Every user-supplied value goes through `esc()` before it enters a string.

Search boxes and filters would lose focus if the whole tab re-rendered on each keystroke, so those handlers replace only the table body (`#drows`, `#srows`) or the detail panel (`#ddetail`, `#sdetail`). Everything else re-renders the tab.

## Events

`events.js` registers five listeners on `document` (click, change, input, submit, keydown) and routes by `data-act` attribute or element id. Views never attach listeners, so re-rendering never leaks handlers.

## Routing

### Student portal: alerts and prep

Alerts are **derived, not stored**. `core/notifications.js` computes them from the drives, the student's applications and today's date; only which alert ids were read is saved (`notifRead[studentId]`). Alert ids include a time bucket (0, 1, 3, 7, 14 days to go), so a reminder you have read returns as the drive gets closer. `core/prep.js` builds a dated checklist for a drive from the student's skill gaps, aptitude score and application stage; ticked steps are saved in `prepDone["studentId|driveId"]` by `core/progress.js`. `core/dates.js` holds date helpers; dates are `YYYY-MM-DD` strings. The portal's date picker overrides "today" (`UI.today`) so the feature can be demonstrated on any day. Sample drive dates are generated relative to the day the data is created, so demos never go stale; the storage key was bumped to `krmu-placeiq-v3` for this.

Tabs are URL hashes: `#dashboard`, `#drives`, `#students`, `#portal`, `#practice`. `route()` reads the hash on load and on `hashchange`. Hash routing needs no server configuration, so the app works on any static host.

## Algorithms

All weights live in `js/config.js`.

- **Eligibility** (`scoring.eligible`): CGPA at or above the minimum, active backlogs at or below the limit, programme in the drive's list. Returns the reasons for any failure in plain words.
- **Readiness** (`scoring.readiness`): CGPA 35, aptitude 25, skills 20, projects 10, internships 10, minus 10 per backlog up to 20. Skills, projects and internships reach full marks at 6, 3 and 2.
- **Match** (`scoring.matchScore`): 55% of the share of required skills the student has, plus 45% of readiness.
- **Adaptive round** (`quiz.js`): start at level 2, ten questions, correct answer goes up one level, wrong answer down one, never repeat a question, fall back to the nearest level if one runs out. Score is `round(100 * points / 28)` capped at 100, where a correct answer earns its level in points.

## Persistence

`core/store.js` saves `store.D` to `localStorage` under `STORAGE_KEY` after every change and reads it back on load. Storage is per browser and per device. Reads and writes are wrapped in `try/catch`, so the app still works in private windows or when storage is blocked, but changes are then lost on reload.

## Testing strategy

- `tests/unit/` runs the pure core and the data files in Node: scoring rules, the adaptive engine, CSV parsing, the sample generator's invariants, and checks that the official data's totals and the claims in its notes are true.
- `tests/e2e/smoke_test.py` drives a real browser through every tab and the main actions, and checks for JavaScript errors and horizontal overflow at phone width.

## Moving to a real backend

The current design keeps this straightforward, because state is already plain data and the views only read it.

1. **API and database.** Node.js with a REST or GraphQL API over PostgreSQL. Tables for students, drives, applications, offers, assessments and an audit log. Replace `loadState` and `saveState` with API calls; `store.D` keeps the same shape.
2. **Authentication and roles.** University single sign-on (Google Workspace or Microsoft Entra). Roles: student, coordinator, CDC head, recruiter. The Student portal's "Viewing as" selector becomes the signed-in student.
3. **Data import.** Excel and CSV upload with validation and a preview step, or a scheduled sync from the student information system.
4. **Notifications.** Email or WhatsApp alerts for new drives, shortlists and interview slots.
5. **Assessments.** A larger tagged question bank, timed sections, and item-response-theory scoring in place of the current points rule.
6. **Privacy.** Student records are personal data. Apply the Digital Personal Data Protection Act 2023: record consent, limit access by role, encrypt in transit and at rest, and keep an audit trail.
7. **Framework.** Optional. Moving the views to React or Next.js is straightforward because each view is already a function from state to markup, and the CSS tokens can be reused unchanged.
