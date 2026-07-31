# Skill Registry — backend-project-gym

## Sources Scanned
- User skills: `C:\Users\PC FS SOLUCIONES\.gemini\extensions\superpowers\skills\`, `C:\Users\PC FS SOLUCIONES\.agents\skills\`
- Project skills: none found
- Project conventions: `GEMINI.md`

## Selected Skills (non-SDD)
| Skill | Trigger (compact) | SKILL.md Path |
|---|---|---|
| brainstorming | before creating/modifying behavior | `C:\Users\PC FS SOLUCIONES\.agents\skills\brainstorming\SKILL.md` |
| systematic-debugging | bugs, test failures, unexpected behavior | `C:\Users\PC FS SOLUCIONES\.agents\skills\systematic-debugging\SKILL.md` |
| api-design-principles | API design/review/standards | `C:\Users\PC FS SOLUCIONES\.agents\skills\api-design-principles\SKILL.md` |
| error-handling-patterns | implementing error handling patterns | `C:\Users\PC FS SOLUCIONES\.agents\skills\error-handling-patterns\SKILL.md` |
| best-practices | security/quality modernization | `C:\Users\PC FS SOLUCIONES\.agents\skills\best-practices\SKILL.md` |
| work-unit-commits | split implementation into reviewable commits | `C:\Users\PC FS SOLUCIONES\.gemini\skills\work-unit-commits\SKILL.md` |
| verification-before-completion | before claiming work is complete | `C:\Users\PC FS SOLUCIONES\.gemini\extensions\superpowers\skills\verification-before-completion\SKILL.md` |

## Compact Rules

### Project Conventions (from GEMINI.md)
- Backend is NestJS + MongoDB with context modules under `src/context/`.
- Respect controller → service → repository → schema module flow.
- Use Vitest for unit/e2e, ESLint + Prettier + Biome for quality.
- Strict TDD Mode is active.

### Cross-skill Operational Rules
- Do not skip requirement clarification before creative changes (brainstorming first).
- For bugs or failing tests, run systematic debugging workflow before proposing fixes.
- For new/changed endpoints, apply API design principles and explicit error semantics.
- Keep commits scoped as small reviewable work units.

## Backend Snapshot
- Stack: NestJS v10, TypeScript 5.x, Mongoose, Firebase Admin, Fastify adapter.
- Test runner: Vitest (`test:unit`, `test:e2e`).
- Quality: ESLint (`lint`), Prettier, TSC (`npx tsc --noEmit`).
- Persistence Mode: Engram.
- Strict TDD: Enabled.
