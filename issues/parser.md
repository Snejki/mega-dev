## Problem

The shared date parser reads MM/DD/YYYY for tenants whose locale writes DD/MM/YYYY. A booking or calendar invite can land in the wrong month/day when both fields are valid. This is the primary cause in the desk's merged ticket #4471; the statement that every report there has one cause is incorrect.

## Scope

**379 of 412 distinct reports** merged into #4471. Count once per report ID (427 export rows include 15 overlapping copies). The reports span 11 tenants, 2026-04-01 through 2026-10-04. Five reports noted by the desk as a one-day move are included here under their tenant-derived cause, not counted as a third issue. Do not classify by `meta.intakeTag`: 23 of these parser reports were tagged `hint` at intake.

## Evidence and reproduction

- `src/lib/data/reports-4471.json`, `src/lib/data/tenants/*.json`, `src/lib/kb/causes.ts` (`uniqueById`, `dayFirst`, `causeOf`, `groupByCause`), `src/lib/data/desk-notes.json`.
- For a day-first tenant, enter a date such as 07/04/2026 through a path that uses the shared parser (e.g. an app booking). The tenant means 7 April, but month-first parsing treats it as 4 July. Report R-41200 describes this reversal.
- Compare with the separate booking-v3 form-hint issue: that path tells people to enter a month-first date, then interprets it day-first. The fixes must be tested separately.

## Resolution — fixed

The course's engineering update says #4471 closed on 2026-10-05:
`fix(dates): parse dd/mm for eu locales`. Close this parser issue as completed.
This is the desk's reported outcome, not an independently tested production fix.

## Original expected behavior

Parse input according to the tenant's date order and preserve the intended booking/invite date. Keep the 379 parser reports together, and do not close the separate hint issue when this fix ships.

KB: `src/routes/kb/incidents/4471-split/+page.svx`; portable rendered view: `preview/4471-split.html`.
