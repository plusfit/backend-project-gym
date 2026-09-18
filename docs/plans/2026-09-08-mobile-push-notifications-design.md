# Mobile Push Notifications — Design

**Date:** 2026-09-08
**Status:** Approved design, pending implementation plan
**Scope:** `notifications-service`, `backend-project-gym`, `clients-project-gym-v2` (PWA), `frontend-project-gym-v2` (admin dashboard)

## 1. Goal

Send automated push reminders to gym clients through the PWA:

| Rule key | Trigger | Example copy |
| --- | --- | --- |
| `routineDay` | Today is one of the client's attended days | "Today: Legs. Your routine is ready." |
| `paymentDue` | `Client.availableDays <= daysThreshold` | "You have 3 days left on your plan." |
| `pointsNearReward` | `reward.pointsRequired - client.availablePoints <= pointsMargin` for some enabled reward | "You are 40 points away from a free shake." |

Non-goals for this iteration: admin-editable copy templates, native (store) apps, per-client explicit weekday → subroutine overrides, email/SMS.

## 2. Context and constraints

- The client app is and will remain a **PWA**. Delivery is Web Push. iOS only delivers push to PWAs installed on the home screen (iOS 16.4+); Safari tabs receive nothing.
- Transport is **FCM for web** (`firebase-admin` server side, `@angular/fire/messaging` client side). The Firebase project `project-gym-e5005` already exists; no new infrastructure.
- `notifications-service` already has a channel abstraction (`INotificationChannel`, `channel.registry.ts`), an `agenda` queue, API-key auth, audit log and batch/job tracking. Only WhatsApp is registered today.
- `backend-project-gym` already talks to `notifications-service` (`NOTIFICATIONS_SERVICE_URL`, `NOTIFICATIONS_SERVICE_API_KEY`) and already runs crons with `@nestjs/schedule`.
- Attended weekdays live in the existing `Schedule` collection (`Schedule.clients[]`, `Schedule.day` as a Spanish day name). A client can hold at most one schedule per weekday (enforced in `schedules.service.ts`).
- Billing is prepaid days (`Client.availableDays`), not due dates. Payment reminders are threshold-based.
- No code currently maps a weekday to a subroutine. That rule exists only as team knowledge.

## 3. Approaches considered

| Option | Verdict | Reason |
| --- | --- | --- |
| **A. New `push` channel in `notifications-service`; business rules in `backend-project-gym`** | **Chosen** | Reuses queue, retry, audit, history, API keys. One place in the system knows how to send. Admin push campaigns become possible later with the existing composer flow. |
| B. Send directly from `backend-project-gym` with `firebase-admin.messaging()` | Rejected | Two senders, no unified history. Recreates the problem `notifications-service` was built to solve. |
| C. Firebase Cloud Functions + FCM topics | Rejected | Moves business rules out of NestJS and duplicates Mongo access from another platform. |

## 4. Architecture and data flow

```
clients-project-gym-v2 (PWA)
  1. user gesture → request permission → FCM token
  2. POST /clients/me/push-tokens ─────────────┐
                                               ▼
backend-project-gym                       Client.pushTokens[], Client.notificationPreferences
  3. reminders cron (every 15 min) loads ReminderSettings, picks rules whose sendHour == now (Montevideo)
  4. one query: active clients with ≥1 token; one aggregation: attended days per client from `schedules`
  5. per client, per enabled rule: evaluate → ReminderIntent | null
  6. insert ReminderDispatch { clientId, ruleKey, dateKey } (unique) → skip on duplicate
  7. render title/body/data, expand client → N tokens
  8. POST /notifications/bulk-direct { channel: 'push', items: [{ to: token, title, body, data }] }
                                               │
                                               ▼
notifications-service
  9. Batch + Jobs → agenda job `notifications.dispatch.push` (concurrency 10, no anti-burst delay)
 10. PushChannel.send() → FCM
 11. Job.status / Job.failureCode + audit-log
                                               │
backend-project-gym                            ▼
 12. cleanup cron (every 30 min) reads batches of the last 24h, removes tokens with failureCode UNREGISTERED
```

Principles:

- **Backend renders, service delivers.** `notifications-service` never knows routines, points or plans. Same rule already applied to `{nombre}` interpolation.
- **The service recipient is the token, not the client.** The backend expands one client into N devices.
- **Invalid tokens flow back.** FCM permanent failures are recorded per job and pruned by the backend.
- **Two enable levels.** Gym-wide `ReminderSettings` (admin kill switch and parameters) AND per-client `notificationPreferences` (opt-out per rule). A rule fires only when both are on.

## 5. Components and data model

### 5.1 `notifications-service`

- `INotificationChannel.send(to, payload: NotificationPayload)` where `NotificationPayload = { body } | { title, body, data? }`. Additive change; `whatsapp.channel.ts` reads `payload.body`.
- New `src/contexts/channels/push/push.channel.ts` (`key = 'push'`) and `fcm.client.ts` wrapping `firebase-admin.messaging()`. Credential via env `FIREBASE_SERVICE_ACCOUNT` (base64 JSON), validated in `env.validation.ts`.
- DTOs: `channel` enum adds `'push'`. `to` validation becomes channel-conditional: E.164 for `whatsapp`, non-empty string for `push`. `items[]` accept optional `title` and `data`.
- `Job` schema adds `channel` and `failureCode` (`UNREGISTERED`, `INVALID_ARGUMENT`, `TRANSIENT`).
- `bulk.service` routes by channel to a dedicated agenda job name `notifications.dispatch.push` (concurrency 10, no random delay). Daily cap stays WhatsApp-only.
- `GET /notifications/batches/:id` already exists; it must expose per-job `failureCode` so the backend can prune tokens.

### 5.2 `backend-project-gym`

**Client schema additions**

```ts
pushTokens: { token: string; userAgent?: string; createdAt: Date; lastSeenAt: Date }[]
notificationPreferences: Record<string, boolean> // opt-outs only; absent means enabled
```

`notificationPreferences` stores **opt-outs keyed by rule**, not one boolean column
per rule. A rule the client never touched is enabled, so adding a rule needs no
schema change and no migration — which is what section 8 is aiming at. The
helper `effectivePreferences()` resolves the stored exceptions into a full map.

**Client-facing endpoints** (JWT, own client only)

- `POST /clients/me/push-tokens` — upsert by token; if the token belongs to another client, move it.
- `DELETE /clients/me/push-tokens/:token`
- `GET /clients/me/notification-preferences`, `PATCH /clients/me/notification-preferences`

**New `reminders` module**

- `reminder-settings.schema.ts` — singleton document:
  ```ts
  routineDay:       { enabled, sendHour }
  paymentDue:       { enabled, sendHour, daysThreshold }
  pointsNearReward: { enabled, sendHour, pointsMargin }
  ```
  `GET/PATCH /reminders/settings` (Role.Admin).
- `GET /reminders/catalog` — returns the registered rules as `{ key, label, description, params: [{ name, type, min?, max? }] }[]`, derived from the rule classes. Both frontends render their toggles from this catalog, so adding a rule never requires a frontend change.
- `reminder-dispatch.schema.ts` — idempotency log: `{ clientId, ruleKey, dateKey, status: 'pending' | 'sent', batchId?, createdAt }`, unique index on `(clientId, ruleKey, dateKey)`. Inserted before sending; deleted if the service call fails; moved to `sent` with `batchId` on success.
- `rules/` — one class per rule implementing `ReminderRule { key: RuleKey; evaluate(client: ClientContext, ctx: RuleContext): ReminderIntent | null }`. Pure functions, no I/O.
- `reminders-cron.service.ts` — `@Cron` every 15 minutes. Loads settings, filters rules by `sendHour` against Montevideo time (`getUruguayTime()`), loads clients once, runs rules, dedupes, batches into one `bulk-direct` call per rule.
- `token-cleanup.service.ts` — `@Cron` every 30 minutes; processes `sent` dispatches from the last 24h, fetches batch status, prunes `UNREGISTERED` tokens.
- `NotificationsService.bulkPush(items)` — extends the existing client of `notifications-service`.

**Routines domain addition**

- `TodaySubRoutineResolver` lives in the routines context, not in `reminders`, so the PWA home can reuse it later. Input: client routine + attended weekdays + date. Logic: sort attended weekdays, index into `Routine.subRoutines[]` in order, cycle when there are more days than subroutines, return `null` when today is not attended or the client has no routine. Includes an explicit Spanish day-name → weekday table tolerant of accent variants.
- No schema change on `Routine`, `SubRoutine` or `Schedule`.

### 5.3 `clients-project-gym-v2` (PWA)

- `src/firebase-messaging-sw.js` registered as an asset; `provideMessaging()` from `@angular/fire`; public VAPID key in `environment`.
- `core/services/push.service.ts`: request permission only after an explicit user gesture; obtain token; register with backend; re-register on every app start to refresh `lastSeenAt`; foreground `onMessage` handler.
- Settings page: toggles rendered from `GET /reminders/catalog`, bound to `notificationPreferences`. On iOS without `display-mode: standalone`, show an "add to home screen" banner instead of the enable button. If permission is `denied`, show how to re-enable from browser settings and never re-prompt.
- Service worker `notificationclick` opens `data.url` (deep link to routine, plan or rewards).

### 5.4 `frontend-project-gym-v2` (admin dashboard)

- New tab "Automatic reminders" inside the existing `notifications` feature: toggles and parameters rendered from `GET /reminders/catalog`, bound to `ReminderSettings`.
- Extend the existing "test send" action to also send a push to the admin's registered device.
- Routine editor: warn that reordering `subRoutines[]` changes which subroutine every enrolled client gets on a given day.

## 6. Error handling

| Failure | Handling |
| --- | --- |
| Same token registered by another client | Upsert moves the token to the new client (device changed account). |
| FCM `registration-token-not-registered`, `invalid-argument` | Job → `failed`, `failureCode` set, no retry. Pruned by cleanup cron. |
| FCM `unavailable`, `internal`, quota | Retry with backoff, max 3, reusing `scheduleRetry` in `dispatch-processor.ts`. |
| `notifications-service` unreachable during cron | Delete the `pending` dispatch record; next 15-minute tick retries. `dateKey` still guarantees one send per day. |
| One rule throws | Per-rule `try/catch`; other rules continue. Summary log per rule: evaluated / sent / skipped / failed. |
| Client has no routine, no schedule, or today is a rest day | `routineDay` returns `null` silently. |
| Permission denied in PWA | Persist state, never re-prompt, show guidance. |
| iOS not installed as PWA | Do not request permission; show install banner. |

## 7. Testing

Strict TDD is active: tests are written before implementation.

**`notifications-service`**
- `PushChannel` with mocked FCM client: permanent vs transient classification, payload mapping.
- DTO validation: `to` accepts E.164 only for `whatsapp`, token strings for `push`; `items[]` with `title`/`data`.
- `bulk.service` routes push to `notifications.dispatch.push` without random delay; WhatsApp path unchanged.
- e2e: `POST /notifications/bulk-direct` with `channel: 'push'` creates batch and jobs with `channel = 'push'`.

**`backend-project-gym`**
- `TodaySubRoutineResolver`: day-name table with and without accents, ordering, cycling, `null` on rest day / no routine / no schedule.
- Each rule as a pure function: fires, does not fire, boundary values (`availableDays == daysThreshold`, exact `pointsMargin`), disabled reward ignored.
- Idempotency: two cron runs on the same `dateKey` produce one dispatch; failed service call allows retry.
- Cron orchestration with mocked sender: respects both enable levels, batches per rule, per-rule isolation on exceptions.
- Token endpoints: upsert, move between clients, delete. Cleanup prunes only `UNREGISTERED`.

**`clients-project-gym-v2`**
- `push.service` with mocked `Messaging`: no prompt without gesture, registration call, denied state persisted.
- iOS standalone detection.
- Preferences state (NgXs) and toggle wiring.

**Manual before enabling rules**
- Send a real push to the admin device through the extended test-send action; verify icon, title, body and deep link on Android Chrome and iOS installed PWA.

## 8. Extending the system

### 8.1 Where each piece lives

| Piece | Location | Reason |
| --- | --- | --- |
| Rule (when it fires) | Code, one class in `reminders/rules/` | Business logic, tested as a pure function |
| Copy (title, body, deep link) | Code, `render()` on the same class | Fixed copy; editable templates deferred |
| Enabled flag and parameters | Mongo, `ReminderSettings` singleton | Admin changes it without a deploy |
| Per-client opt-out | Mongo, `Client.notificationPreferences` | Each client decides |
| What was sent and when | Mongo, `ReminderDispatch` | Idempotency and traceability |

### 8.2 Adding a new scheduled rule

1. Create `<name>.rule.ts` implementing `ReminderRule` (`key`, `evaluate`, `render`, catalog metadata).
2. Add the key to the `RuleKey` union and register the class in the rules list. The cron and the catalog pick it up.
3. Add `<name>: { enabled: false, sendHour, ...params }` to the `ReminderSettings` schema with defaults.
4. Nothing to do for client preferences: they are stored as opt-outs by key, so the new rule is enabled by default for everyone.
5. Write the rule tests first. Deploy with the rule disabled. The admin enables it from the dashboard.

A rule also declares `requires: ReminderDataSource[]` — the shared data it cannot
decide without. The cron loads each source independently, so if one source is
unavailable the rules that depend on it are reported as failed while the rest
still deliver.

No frontend change is required: both UIs render from the catalog.

### 8.3 Cases that are not scheduled rules

- **One-off admin campaigns** ("closed tomorrow for the holiday"): use the existing composer flow with `channel: 'push'`. No rule, no settings.
- **Event-driven notifications** ("reward redeemed", "new routine assigned"): triggered by the owning domain service at the moment of the event through the same `bulkPush` and the same opt-out check. They do not go through `ReminderDispatch` because the event is unique by nature. Supported by this design, not implemented in this scope.

## 9. Rollout order

1. `notifications-service`: push channel, DTO generalization, job routing. Deployable alone; WhatsApp unaffected.
2. `backend-project-gym`: tokens, preferences, `TodaySubRoutineResolver`, `reminders` module with all rules **disabled by default** in `ReminderSettings`.
3. `clients-project-gym-v2`: service worker, permission flow, settings page.
4. `frontend-project-gym-v2`: reminders tab, push test-send, routine editor warning.
5. Enable rules one at a time from the dashboard, starting with `paymentDue` (simplest data), then `pointsNearReward`, then `routineDay`.

Each step is an independent PR.

## 10. Prerequisites outside code

- Firebase Cloud Messaging enabled on `project-gym-e5005`; Web Push certificate (VAPID key pair) generated.
- Service account JSON for `notifications-service` (`FIREBASE_SERVICE_ACCOUNT`).
- PWA `manifest.json` icons suitable for notification badges.

## 11. Open items deferred

- Admin-editable copy templates.
- Explicit per-client weekday → subroutine override.
- Push campaigns from the admin composer (design supports it; not in this scope).
- Timezone handling in the PWA home (`new Date().getDay()` is browser-local); irrelevant to push, worth aligning when the home shows "today's subroutine".
