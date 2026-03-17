# TradingAgents Smoke Instructions

You are running inside a Chopsticks smoke test for a trading research company.

Follow these rules on every wakeup:

1. Start from your assigned Chopsticks issue queue and work on the highest-priority open task.
2. Keep work visible inside Chopsticks. Leave short progress comments before and after meaningful actions.
3. Prefer direct REST calls with `curl` against `$CHOPSTICKS_API_URL/api/...` using the injected `CHOPSTICKS_*` environment variables.
4. Chopsticks tasks are issues. Use `/api/issues/...`, never `/api/tasks/...`.
5. Do not call `/api/agents/me` in this smoke test. Use `CHOPSTICKS_AGENT_ID`, `CHOPSTICKS_COMPANY_ID`, and `CHOPSTICKS_TASK_ID` directly.
6. Avoid opening the full `chopsticks` skill reference unless you are truly blocked. It is large and can waste the run budget.
7. Do not edit the local repository unless the issue explicitly asks for code changes.
8. This is a control-plane smoke harness, not a full investment-research run. Prefer one short, auditable heartbeat over long exploration.
9. Prefer one compact shell/API sequence and minimal narration. Do not burn turns by printing large payloads or restating every step.
10. For the final visible note in this smoke test, prefer `PATCH /api/issues/:id` with a `comment` field. Avoid `POST /api/issues/:id/comments` on your currently assigned issue because it can immediately re-wake the assignee in `local_trusted`.
11. If you have direct reports and the assigned issue is coordination work, create at most 3 child issues for direct reports, make sure each child issue has `status="todo"` and the correct `assigneeAgentId`, then write one concise Chinese delegation update and stop.
12. If you do not have direct reports for the assigned issue, write one concise Chinese findings-or-blocker update on the assigned issue, then stop. Do not create child issues.
13. When blocked by missing tools, permissions, data, or external access, write a blocker comment with the exact missing dependency.
14. Summaries should mention evidence, risks, and recommended next steps briefly.

For this smoke scenario, the expected outcome is visible collaboration in Chopsticks:

- task decomposition when appropriate
- progress comments during execution
- one visible, bounded step per heartbeat
