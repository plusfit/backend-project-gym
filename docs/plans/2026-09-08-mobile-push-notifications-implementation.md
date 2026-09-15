# Mobile Push Notifications — Implementation Plan

**Companion to:** `2026-09-08-mobile-push-notifications-design.md`
**Mode:** Strict TDD. Every task writes the failing test first.
**Delivery:** five independent PRs, in order. Each one is deployable on its own.

## Status

| PR | Repo | Branch | State |
| --- | --- | --- | --- |
| 1 | `notifications-service` | `feat/push-channel` | Done, 6 commits, not pushed |
| 2 | `backend-project-gym` | `feat/push-reminders` | Done, 3 commits, not pushed |
| 3 | `clients-project-gym-v2` | `feat/push-notifications` | Done, 1 commit, not pushed |
| 4 | `frontend-project-gym-v2` | `feat/reminders-settings` | Done, 1 commit, not pushed |
| 5 | — | — | Blocked on the Firebase credentials below |

Test counts after the work: notifications-service 173 unit + 11 e2e,
backend-project-gym 202 unit. Typecheck and build pass in all four repos.

**Deviations from the design, and why**

- Client preferences are a map of opt-outs keyed by rule, not fixed boolean
  columns. Adding a rule now needs no schema change or migration.
- Rules declare `requires` so one unavailable data source does not take down a
  whole cron pass. This came out of a failing test.
- `BulkService.getBatch` returns `failures[]` alongside the batch, which is what
  the token cleanup reads; the design only said "expose failureCode".

**Found while implementing, not fixed**

- `backend-project-gym` tracks `.env` in git.
- `notifications-service` has no ESLint config at the repo root, so `npm run
  lint` is broken there.
- Mongoose 9 in `notifications-service` no longer casts a string to ObjectId
  inside a query filter. Worth auditing other queries that filter by a string id.

---

## PR 1 — `notifications-service`: push channel

**Goal:** the service can deliver a push notification through FCM, addressed by device token, without touching the WhatsApp path.

**Repo:** `notifications-service`
**Deployable alone:** yes. Nothing calls the new channel until PR 2.

### 1.1 Generalize the channel payload

- [ ] Test: `whatsapp.channel.spec.ts` still passes when `send()` receives a payload object instead of a raw string.
- [ ] Introduce `NotificationPayload` in `src/contexts/channels/`: `{ body: string }` for WhatsApp, `{ title: string; body: string; data?: Record<string, string> }` for push.
- [ ] Change `INotificationChannel.send(to: string, payload: NotificationPayload)`.
- [ ] Update `whatsapp.channel.ts` to read `payload.body`. No behaviour change.
- [ ] Update every existing caller (`notifications.service.ts` dispatch path).

**Acceptance:** the full existing suite passes untouched in behaviour.

### 1.2 Env and FCM client

- [ ] Test: `env.validation` rejects a malformed `FIREBASE_SERVICE_ACCOUNT`, accepts a valid base64 JSON.
- [ ] Add `FIREBASE_SERVICE_ACCOUNT` (base64-encoded service account JSON) to the Zod schema. Optional: the service must boot without it, with the push channel unregistered.
- [ ] Create `src/contexts/channels/push/fcm.client.ts` wrapping `firebase-admin` app init plus `messaging().send()`. Single app instance, lazy.
- [ ] Add `firebase-admin` to dependencies.

**Acceptance:** booting without the variable logs a warning and leaves `push` out of the registry; booting with it registers the channel.

### 1.3 PushChannel with failure classification

- [ ] Test: mocked FCM returns `messaging/registration-token-not-registered` → result is permanent with `failureCode: 'UNREGISTERED'`.
- [ ] Test: `messaging/invalid-argument` → permanent, `INVALID_ARGUMENT`.
- [ ] Test: `messaging/unavailable`, `messaging/internal-error`, quota errors → transient, `TRANSIENT`.
- [ ] Test: success maps `title`, `body` and `data` onto the FCM webpush payload, including `fcmOptions.link` from `data.url`.
- [ ] Implement `push.channel.ts` with `key = 'push'`, registered through `CHANNEL_TOKEN`.
- [ ] Implement `healthy()` as an app-initialized check, not a network call.

**Acceptance:** classification is table-driven and every FCM error code the table does not know falls back to transient.

### 1.4 DTO: channel-conditional recipient validation

- [ ] Test: `channel: 'whatsapp'` still requires E.164 in `to` and in `items[].to`.
- [ ] Test: `channel: 'push'` accepts an opaque non-empty token and rejects an empty string.
- [ ] Test: `items[]` accept optional `title` and `data`; `title` is required when the channel is push.
- [ ] Add `'push'` to the channel enum in `SendNotificationDto` and the bulk DTOs.
- [ ] Replace the unconditional E.164 rule with a custom validator that switches on `channel`.
- [ ] Keep the existing XOR constraint between `to[] + message` and `items[]` untouched.

**Acceptance:** no existing WhatsApp request shape changes.

### 1.5 Job routing and queue separation

- [ ] Test: a push batch schedules `notifications.dispatch.push`; a WhatsApp batch still schedules `notifications.dispatch`.
- [ ] Test: push jobs carry no cumulative random delay; WhatsApp jobs still do.
- [ ] Test: the daily cap is applied to WhatsApp and skipped for push.
- [ ] Add `channel` and `failureCode` to `job.schema.ts`.
- [ ] Route by channel in `bulk.service.ts`.
- [ ] Register the push processor with `concurrency: 10`, reusing the existing `scheduleRetry` guard from `dispatch-processor.ts`.
- [ ] On a permanent failure, persist `failureCode` and do not retry. On transient, retry with backoff, max 3.

**Acceptance:** the single-session WhatsApp constraint is untouched; push runs in parallel.

### 1.6 Expose failure codes for token pruning

- [ ] Test: `GET /notifications/batches/:id` includes `failureCode` per failed job.
- [ ] Extend the batch response mapper.

**Acceptance:** PR 2 can prune dead tokens from this response alone.

### 1.7 End to end

- [ ] e2e: `POST /notifications/bulk-direct` with `channel: 'push'` and three `items[]` creates one batch and three jobs with `channel: 'push'`.
- [ ] e2e: the same call with an API key lacking the `bulk` scope is rejected.

### PR 1 review checklist

- Audit log masks the token the way `PhoneUtil.mask` masks phones. A full FCM token in logs is a device identifier.
- No WhatsApp test was modified to make a push test pass.
- The service still boots with the FCM variable absent.

---

## PR 2 — `backend-project-gym`: tokens, rules and cron

**Goal:** the backend decides who gets notified and sends it. Every rule ships disabled.

Ordered slices, each one a work unit:

1. **Client schema and token endpoints.** `pushTokens[]`, `notificationPreferences`, the four `/clients/me/...` routes. Tests cover upsert, moving a token between clients, and delete.
2. **`TodaySubRoutineResolver`** in the routines context. Spanish day-name table with accent variants, ordering of attended days, index mapping onto `subRoutines[]`, cycling, `null` on rest day or missing routine. Pure, no I/O, heavily tested. This is the highest-risk unit in the whole feature.
3. **`reminders` module skeleton.** `ReminderSettings` singleton, `ReminderDispatch` with the unique index, the `ReminderRule` interface, the registry and `GET /reminders/catalog`.
4. **The three rules** as pure classes with boundary tests: `availableDays == daysThreshold`, exact `pointsMargin`, disabled rewards ignored, both enable levels respected.
5. **Cron orchestration.** 15-minute tick, `sendHour` filtering against `getUruguayTime()`, one client query plus one `schedules` aggregation, per-rule `try/catch`, dispatch record inserted before sending and removed on failure, batched `bulkPush` per rule, summary log.
6. **Token cleanup cron.** 30-minute tick over `sent` dispatches of the last 24 hours, prune `UNREGISTERED` only.

**Acceptance for the PR:** with every rule disabled, deploying changes nothing observable. Enabling a rule in a test database produces exactly one dispatch per client per day across repeated cron runs.

**Size risk:** this exceeds a 400-line review budget. Split into at least two chained PRs, boundary between slice 2 and slice 3.

---

## PR 3 — `clients-project-gym-v2`: PWA delivery

1. Firebase messaging service worker as a build asset, `provideMessaging()`, public VAPID key in `environment`.
2. `push.service.ts`: permission requested only after a user gesture, token registration, re-registration on app start, denied state persisted and never re-prompted, foreground `onMessage`.
3. Settings page rendered from `GET /reminders/catalog`, bound to `notificationPreferences`.
4. iOS guard: detect `display-mode: standalone`; show the install banner instead of the enable button.
5. `notificationclick` in the service worker opens `data.url`.

**Acceptance:** a real push received on Android Chrome and on an installed iOS PWA opens the right screen.

---

## PR 4 — `frontend-project-gym-v2`: admin control

1. "Automatic reminders" tab inside the existing notifications feature, rendered from the catalog.
2. Push test-send reusing the existing test-send action.
3. Routine editor warning about reordering `subRoutines[]`.

---

## PR 5 — Enablement

Not code. Enable one rule at a time from the dashboard, in this order, verifying dispatch logs after each:

1. `paymentDue` — simplest data, no routine dependency.
2. `pointsNearReward`.
3. `routineDay` — depends on the resolver and on schedule data quality.

---

## Prerequisites before PR 1 merges

- FCM enabled on `project-gym-e5005`.
- Web Push certificate (VAPID key pair) generated; public key for PR 3, service account for PR 1.
- Decide where the service account secret lives in the deploy environment.
