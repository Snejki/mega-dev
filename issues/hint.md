## Problem

The booking-v3 form displays **MM/DD/YYYY** under its date field for day-first tenants. People follow the hint and enter a month-first date, but the form reads it in the tenant's day-first order. Changing only the shared parser will not fix the misleading instruction on this form.

## Scope

**33 of 412 distinct reports** merged into desk ticket #4471 belong to this separate cause. These come from booking-v3 form submissions at `copper.studio`, `alder.physio`, and `pale.harbour`, from 2026-04-17 through 2026-09-22. The 427 export rows include 15 overlapping copies; count unique report IDs. Intake guessed `parser` for 15 of these 33 reports, so do not use `meta.intakeTag` as the cause.

## Evidence and reproduction

- `src/lib/data/reports-4471.json`, `src/lib/data/tenants/*.json`, `src/lib/kb/causes.ts` (`uniqueById`, `dayFirst`, `causeOf`, `groupByCause`).
- On a booking-v3 form for a day-first tenant, follow the MM/DD/YYYY hint and enter 04/07/2026 intending 7 April. The form reads DD/MM/YYYY and interprets the date as 4 July.
- This is distinct from app/email reports where the shared month-first parser misreads dates written day-first.

## Expected

## Resolution — won't fix

The course's engineering update says #4471 closed on 2026-10-05 and the
booking-v3 form was retired. This hint issue is **won't fix**, closed as
**not planned**. Retirement is not evidence that the hint was corrected.

## Original expected behavior

Make the hint match the date order accepted by the form for the tenant; verify the form's parsing and the displayed instruction together. Give these reports their own ticket rather than keeping them only under #4471.

KB: `src/routes/kb/incidents/4471-split/+page.svx`; portable rendered view: `preview/4471-split.html`.
