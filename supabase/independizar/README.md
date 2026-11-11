# Independizar student learning

This migration is specific to Supabase project `tbmhwxywbcmkbjypyxkz`. It is recorded separately from the multi-tenant LMS migration history.

## Verification

- Applied and verified migration `20261111142743` on the connected Independizar project.
- Ran `tests/student_learning.sql` against that project. It passed as the anonymous and authenticated API roles and rolled back its fixtures. The assertions cover profile creation and ownership, Basic and Premium eligibility, expiry, enrollment, lesson release dates, and repeat-safe progress writes.
- Ran `npm run test:unit -- tests/unit/independizar-academy.test.ts`. All six tests passed.
- Ran HTTP smoke checks against the development app connected to Independizar Supabase. The catalog, registration form, and login form rendered. The account route redirected signed-out visitors to login. A temporary account verified Supabase password authentication, profile upsert, the enrollment query, signed-in rendering of the saved profile, and sign-out. The account was then removed.
- ESLint found zero errors in changed TypeScript files. Repository-wide type checking reported errors in the MCP view and existing Playwright and unit tests. The base revision also had unit suite failures.

## Remaining verification

The project has no published courses or lessons. Enrollment, lesson access, and completion were checked with transactional database fixtures. The complete browser flow with published content and delivery of the signup confirmation email remain unverified.
