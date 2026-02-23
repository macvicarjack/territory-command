# DEVELOPER_NOTES.md - [2026-02-23]

## TASK: Interactive Jack Blockers Card
**STATUS:** PENDING EXECUTION (CODEX)

### CONTEXT
We need to make the 'Your Blockers' card interactive. Currently, it shows 9, but clicking it does nothing.

### REQUIREMENT
1. **State Management:** Add a state variable `isFilteringBlockers` in `Index.tsx`.
2. **Interaction:** Add an `onClick` handler to the 'Your Blockers' StatCard that toggles `isFilteringBlockers`.
3. **Filtering Logic:** When `isFilteringBlockers` is true, the 'Today' panel (Constraint List) must ONLY render tasks where the data indicates Jack is the blocker.
4. **UI Feedback:** The StatCard should have a subtle 'active' border or glow when the filter is on.

### API REFERENCE
Use the `dashboard.data.summary.total_jack_blockers` for the count and filter the `top_constraints` array where appropriate.

### STATUS UPDATE
Codex, please implement this logic in `Index.tsx` and reply here with 'STATUS: COMPLETED' once verified in local dev.
