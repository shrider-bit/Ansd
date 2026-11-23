# Assumptions, rules and limits of the prototypes

Every number below is an invented placeholder chosen to be plausible. None is a measurement.
Each prototype repeats its own assumptions in its «المنهجية» (methodology) panel.

## Shared
- Synthetic government: 24 neutral entities in 8 sectors, 12 job families, 88,410 employees
  (`_src/_shared/roster.js`). Fixed random seeds, so every run shows the same figures.
- Retirement age 60, Qatarisation benchmark 60%, grade bands 1–18 as in the department's reference notes.
- State is kept in memory only. Download and print need the file opened locally in a browser.

## أُفُق / Ufuq — policy wind tunnel
- **Model:** cohort-component, 12 families × Qatari/non-Qatari × ages 22–64, yearly steps 2026→2040.
  No entity or grade dimension.
- **Retirement:** statutory at 60 (lever 60–65, all families or scarce ones only). When extended,
  65% stay past 60 and 12% of those leave each year. Extending the age delays the wave rather than removing it.
- **Early retirement (Qataris 45+):** 3% / 5% / 7% a year for ages 45–49 / 50–54 / 55–59, times the lever.
- **Attrition:** Qatari 4% / 2.5% / 1.5% and non-Qatari 9% / 7% / 6% by age band.
- **Demand:** family growth from −0.5% (administrative) to +3.5% (IT) a year, shifted −0.8 / 0 / +1.0 points
  by scenario. Digital transformation removes up to 25% of administrative, finance and customer-service
  demand (15% HR) and adds 20% to IT by 2035.
- **Hiring:** gap × hiring capacity (default 70%) × a market-ease factor, capped at 12% of family headcount a year.
- **Qatarisation:** Qatari hires = target share (default 65%) capped by a per-family graduate pipeline
  (about 2,200 a year in total). Pipeline expansion takes effect after a 4-year lag.
- **Cost:** average annual cost by nationality × four age bands (Qatari 290–560k, non-Qatari 150–265k QAR),
  constant prices, pension liabilities excluded.
- **Uncertainty:** 200 seeded Monte Carlo runs; attrition ±15%, early retirement ±22%, demand growth ±0.4 points.
- **Readiness index:** 40% coverage, 25% Qatarisation progress, 20% cost sustainability, 15% experience continuity.
- **Inverse mode:** random sampling plus local refinement on the central path (about 1,400–1,600 bundles).
  It is a numerical search and is not guaranteed to find the best bundle.
- **Verified:** 50 engine checks in Node (totals, flow conservation, lever directions, determinism).

## جسور / Jusoor — talent bridges
- **Data:** 420 coded profiles and 310 open needs; a 50-skill taxonomy in 12 domains. Willingness to move
  is assumed to come from an employee self-service preference.
- **Fit:** 55% skills (must-have skills count double), 15% grade, 15% family adjacency, 15% experience.
- **Defaults:** minimum fit 62%, must-have coverage 60%, donor coverage floor 100%, at most 24 outgoing moves per entity.
- **Solver:** exact Hungarian (Kuhn–Munkres) assignment, matched against brute force on 600 small cases.
  Donor caps are enforced by a repair heuristic (99.5% of the optimum on average in tests); if the
  first-come baseline ever scores higher, it is used instead, and the methodology panel says so.
- **Bridging moves:** pairs up to 15 points below the fit threshold, with a 4–16 week programme.
- **Mechanism rule:** permanent need → نقل; temporary 6–12 months → ندب; project 18–36 months → إعارة.
  Legal eligibility rules for these mechanisms are not modelled.
- **Impact:** 150 days for an external hire against 35 for an internal move; QAR 38,000 per external hire.
  All three are editable in the interface.
- Every move is a proposal that needs the consent of the employee and both entities.

## بيّنة / Bayyina — evidence desk
- **Data:** 60 requests from the 24 entities, 16 pre-seeded decisions. All parameters are in `BY.RULES`
  in `_src/bayyina/evidence.js`.
- **Need:** workload projected one year at recent growth ÷ standard productivity, blended 60/40 with a
  peer-median benchmark (benchmark only when no workload data was sent), minus current staff net of departures,
  capped at the number requested.
- **Coverage before new posts, in order:** posts vacated by retirement and attrition; approved vacancies;
  redeployment (50% of candidates with fit ≥ 70%); digital alternative (only where an approved project exists).
- **Evidence strength (0–100):** weights workload 30, benchmark 20, track record 15, vacancies 10,
  departures 10, redeployment 5, national pipeline 5, digital 5. Strong ≥ 85, medium 68–84, weak < 68,
  "missing" when workload data or two or more attachments are absent. It measures reliability, not support.
- **Lanes:** fast = strong evidence, estimates agree ≥ 70%, ≤ 15 posts, ≤ QAR 5M, track record ≥ 70%.
- **Portfolio:** greedy knapsack on marginal value per riyal; funding is a strict prefix up to the ceiling.
- **Consistency flag:** approved share differs from recommended share by more than 15 points.
- **Review hours:** 6 manual, 0.5 fast lane, 2.5 deep review, 1 missing-evidence, per request (adjustable).
- **Decisions:** departing from the recommendation requires a written reason of at least 15 characters.
- **Memo:** fixed templates, placeholder header, marked «نموذج تجريبي — غير صادر رسمياً»; no logo, seal or signature.

## مِصفاة / Misfat — data clinic
- Works on pasted Excel cells and CSV/TSV/TXT files (UTF-8, UTF-16, Windows-1256). `.xlsx` files are not
  parsed: copy the cells and paste. The page contains no network code.
- **Rules:** completeness (missing or placeholder values); uniqueness (duplicate ID; same birth date + entity +
  title under different IDs); validity (unreadable, mixed-format, Excel-serial, Hijri-looking and future dates;
  age under 18; at or over 60 while active; hired before 18 or before birth; grade outside the scale;
  salary non-numeric, zero or negative); consistency (spaces, Arabic-Indic digits, spelling and language
  variants, number formats, mixed missing-value symbols); plausibility (salary outlier by IQR within grade
  and nationality; managerial grade under age 26).
- **Score:** records with no issue in a dimension ÷ all records; overall = weighted mean (25/20/25/20/10).
- **Treatments:** only safe standardisations are applied, and only on a click. Duplicates, outliers and
  impossible ages are never auto-fixed. Undo replays from the original data, so it is exact.
- **Disclosure check:** cells below k (default 5) are flagged; complementary suppression is a heuristic
  and should be reviewed before official publication.
- **Scale:** 50,000 rows diagnose in about 3 seconds; typo matching is skipped above 3,000 distinct values.
