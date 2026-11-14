# Worker API: spec-driven development

## Purpose
Serve the Cyberrota static app and expose same-origin account and multiplayer APIs on one free Cloudflare Worker.

## Account acceptance criteria
- Google credentials are verified server-side; a matching `g_csrf_token` cookie/body value is required before login.
- Guest and account sessions are signed, HttpOnly cookies; browser clients never receive signing secrets.
- Progress, export, import and deletion routes require an account session.
- Google client ID is public configuration only; absent credentials disable Google login without breaking guest play.
- Account deletion transfers each hosted room to the oldest remaining human before cascading account data removal.

## Room acceptance criteria
- Create and join route requests to one Durable Object per unguessable room code.
- The Worker supplies account identity from the signed cookie, never trusts a client-provided account ID.
- Room snapshots never contain resume tokens; account room membership is synchronized in D1.
- WebSocket upgrades pass through to the Durable Object; application assets are served by the same Worker.
- Invalid paths/methods and failed operations return stable JSON errors without leaking internal exceptions.

## TDD scenarios
1. Config route returns only the configured public Google client ID.
2. Anonymous account API calls fail with 401; malformed JSON returns 400.
3. Room creation assigns a cryptographically random code and initializes the expected Durable Object.
4. Account identity is injected on room create/join from a valid session, and caller-supplied identity is ignored.
5. Successful room mutations synchronize D1 room membership from the returned snapshot.
6. Account deletion visits linked rooms to transfer host before deleting account rows.

## Deployment
Use a Worker static-assets binding for the Vite build, D1 free database, and SQLite-backed Durable Object class. Secrets are set out of source control. No paid service is required within free quotas.
