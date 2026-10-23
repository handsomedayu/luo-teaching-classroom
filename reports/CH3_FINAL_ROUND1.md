# Third chapter candidate: P23 / P27

Base: `c5edb7c4937ccb327a02e4a3feca512f2950155b`.
Candidate branch: `codex/paperclip-ch3-final-20261023`.

- P27: render targets from stable model terminal keys, preserving original targets after repeated reconnection. Keep the actual branch wire available to restore the main circuit; support switch toggling and reject source shorts. Separate overlapping wire and switch handles without moving their electrical nodes.
- P23: right-clicking the student canvas cancels a pending first terminal before deleting a wire. Same-terminal tapping remains the touch cancellation gesture. Existing wire deletion, undo and reset remain available.
- P27 rheostat: reject the fourth effective reconnection under the existing three-edit limit; no-op connections do not consume edits. Undo releases a slot and reset clears the count.
- P23: identify lamp bypasses from connected nodes and explain local shorting and the remaining lamp's supply voltage. Students remove the bypass themselves.

`tests/ch3-final-defects.cjs` uses real mouse/touch input for experiment changes. `evaluate(goto(...))` is navigation only; other evaluate calls read state or terminal coordinates. Chrome 156.0.8078.48 passed the new cases at 1920×1080, 1366×768 and 844×390 touch simulation. The first run exposed overlapping P27 handles; the fix passed the repeated full path.

Verified examples: P23 correct series 0.20 A / 2 V / 4 V; L1 bypass 0.30 A / 0 V / 6 V. P27 restored main circuit: open S0 leaves L2 on at 0.30 A, closed S0 lights both at 0.90 A, measured by A0. Moving the switch without restoring the main wire remains incorrect. Source shorts are blocked.

Science 601, network 935, advanced model checks (22 pages), model interactions 103, P23 91, P21 49, P22 58, P24 67, P25 67, P26 85, P27 69, P28 63, batch regression 60 and 34-page desktop browser regression 632 passed without failures. Per-page tests include their configured Chrome and WebKit touch cases; the new defect suite uses Chrome touch simulation.

All 34 pages and existing page order remain. No fourth-chapter changes. Screenshots and detailed local results remain in ignored `test-results/`; private teaching sources are excluded from this repository.

This is developer validation, not an independent review or classroom approval. Actual phone hardware, classroom projection, teacher handling and curriculum/exam-source verification remain unverified. No main merge or production release is authorized by this report.

P31 shared edit regression: 120 passed, 0 failed.
