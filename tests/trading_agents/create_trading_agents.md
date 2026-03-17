# TradingAgents Smoke Harness

`create_trading_agents.mjs` is a local smoke harness for quickly bootstrapping a TradingAgents company and observing whether the first manager run, plus optional downstream delegation, behaves as expected.

## What the script now does

1. Checks `GET /api/health`.
2. Creates a new company named `TradingAgents`.
3. Runs `codebuddy_local` adapter environment checks through the Chopsticks API.
4. Creates the 9-agent TradingAgents org via direct board bootstrap at `POST /api/companies/:companyId/agents`.
5. Verifies agent count, adapter type, and reporting structure.
6. Creates a research issue assigned to the portfolio manager.
7. Waits for the automatic wakeup caused by issue assignment.
8. Falls back to a manual `POST /api/agents/:id/wakeup` only if no automatic run appears in the observation window.
9. Polls the portfolio-manager heartbeat run until it reaches a terminal state.
10. Optionally observes descendant issues and downstream heartbeat runs when `CHOPSTICKS_OBSERVE_DESCENDANTS=true`.
11. Summarizes:
   - company id / dashboard URL
   - adapter environment status
   - heartbeat status
   - issue comment count
   - child issue count
   - downstream issue/run counts and warnings
   - dashboard summary

## Why this version is more reliable

- Uses the real REST API throughout instead of shelling out to the CLI for the final wakeup step.
- Removes the old approval step that did not apply to direct board-created agents.
- Uses self-validation with explicit assertions instead of only printing best-effort logs.
- Adds a shared instructions file at `tests/trading_agents/shared-agent-instructions.md` so `codebuddy_local` agents get consistent Chopsticks-specific execution guidance.
- Uses role-aware adapter prompts so managers delegate while individual contributors leave one bounded findings comment.
- Uses `PATCH /issues/:id` with `comment` for the final visible update, which avoids self-wakeup loops seen with `POST /issues/:id/comments` in `local_trusted`.
- Narrows each heartbeat to one auditable step, which keeps the smoke run stable and helps avoid rate-limit or max-turn failures.
- Observes the actual control-plane behavior we care about: issue assignment -> wakeup -> run -> visible artifacts -> optional downstream propagation.

## Environment knobs

- `CHOPSTICKS_API_BASE`
- `CHOPSTICKS_COMPANY_NAME`
- `CHOPSTICKS_TRADING_MODEL`
- `CHOPSTICKS_POLL_INTERVAL_MS`
- `CHOPSTICKS_AUTO_WAKE_WAIT_MS`
- `CHOPSTICKS_HEARTBEAT_TIMEOUT_MS`
- `CHOPSTICKS_MAX_TURNS_PER_RUN`
- `CHOPSTICKS_UI_BASE`
- `CHOPSTICKS_HEARTBEAT_RUN_LIST_LIMIT`
- `CHOPSTICKS_OBSERVE_DESCENDANTS=true`
- `CHOPSTICKS_DESCENDANT_TIMEOUT_MS`
- `CHOPSTICKS_DESCENDANT_SETTLE_MS`
- `CHOPSTICKS_SKIP_RUN=true`

## Expected outcome

For a healthy local setup with authenticated `codebuddy`, the smoke run should:

- create the full org successfully
- create one top-level research issue
- observe at least one heartbeat run for the portfolio manager
- ideally finish that run with `succeeded`
- leave visible collaboration evidence in Chopsticks, ideally comments and/or delegated child issues
- when descendant observation is enabled, show whether child issues also triggered downstream heartbeat runs
