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

## Course management

Migration `20261111160446_independizar_course_management.sql` adds course cover URLs and sort positions, course levels and modules, lesson vocabulary, optional quizzes, and quiz attempts. Existing lesson IDs and completion records are preserved. Unassigned lessons remain available after the grouped lessons, and administrators can move them into modules.

Administrators open **Administrar cursos** from **Mi cuenta**. Create a course, add a level, then add modules and lessons. Numeric positions control display order. Courses, lessons, and quizzes each have an independent publication state. Cover images and lesson videos use HTTPS URLs.

Each lesson can have one optional quiz. The grading function checks course eligibility, enrollment, publication, lesson release time, and the quiz revision. Students receive questions and answer choices, while the answer key stays in an admin-only table. The server calculates a whole-number percentage and stores the selected answers, quiz revision, score, and passing threshold for each attempt. A quiz does not change the existing lesson completion flow.

### Assignment 2 verification

- Applied the migration to the connected Independizar project and confirmed it in migration history.
- Ran `tests/course_management.sql` against the connected database. Administrator creation and editing, ordering, publication, permissions, passing and failing grades, invalid answers, revision checks, and attempt isolation passed. The test rolled back all fixtures.
- Re-ran `tests/student_learning.sql` against the updated database. It passed.
- Ran both Independizar unit suites with `npm run test:unit -- tests/unit/independizar-academy.test.ts tests/unit/independizar-course-management.test.ts`. All 10 tests passed.
- Changed TypeScript files passed ESLint. The repository-wide TypeScript check still reports the existing MCP and test errors.

- Authenticated REST smoke testing created a draft course, level, module, and lesson, saved and edited a quiz, and verified the nested curriculum reads. The local application rendered the signed-in administrator route and excluded the draft from the public catalog.
- A full browser walkthrough remains unverified because Chromium could not start in the execution environment. Production deployment was outside this assignment.
