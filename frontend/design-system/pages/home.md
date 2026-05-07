# Home (Crash Stage) — page override

Inherits from `MASTER.md`. Specifies behaviors only relevant to the live game screen.

## Layout — desktop ≥1024px

- Full-width navbar (sticky, glass, height 64px).
- **Crash history strip** directly under navbar: horizontal scroll of last 20 rounds as colored pills (tier-colored).
- **Stage**: 1100px max-width, 460px tall, glass surface, contains:
  - Starfield (2 parallax layers, paused when `status !== 'running'`).
  - SVG trajectory curve (mounted only while running, redrawn from a buffered set of `[t, multiplier]` samples).
  - Rocket SVG positioned at the curve tip (transforms with `translate3d` + `rotate`).
  - Centered multiplier label (z above rocket).
  - Crash overlay (red flash + skull burst icon).
- **Bet panel + live bets**: 2-column grid below stage, `gap: 24px`. On mobile they stack.

## Layout — mobile ≤768px

- History strip remains horizontal scroll, height 32px.
- Stage shrinks to 280px tall; multiplier 96px.
- Bet panel becomes sticky at bottom, `position: sticky; bottom: 0`, with safe-area inset.
- Live bets feed becomes collapsible accordion ("Apostas ao vivo" toggle).

## Tier mapping (rocket + glow)

| Multiplier | Tier | Color | Trail length | Glow |
|---|---|---|---|---|
| 1.00× → 1.99× | low | `--color-primary` | 60px | `--shadow-glow-orange` |
| 2.00× → 4.99× | mid | `--color-tier-mid` | 120px | `--shadow-glow-gold` |
| 5.00× → 9.99× | high | `--color-tier-high` | 200px | `--shadow-glow-green` |
| 10.00×+ | mythic | `--color-tier-mythic` | 280px | `--shadow-glow-purple` |

## Rocket motion

- Position derived from `progress = (multiplier - 1) / (curveMax - 1)` clamped to `[0, 1]` with `curveMax = 10`.
- Curve: y goes from `90%` to `15%` of stage height; x goes from `8%` to `85%`.
- Easing applied in JS sampling: `progress = 1 - Math.pow(1 - p, 2.2)` (eases the trajectory upward).
- Rocket rotation: `-45deg` at progress 0 → `-65deg` at progress 1 (slight tilt up as it accelerates).
- On `crashed`: rocket freezes at impact point, opacity 0.4, grayscale 0.5, red glow. Bobbing/flame stop.

## Crashed state — value docks to corner

The big multiplier collides visually with the trajectory and the rocket the
moment the round freezes. Apply `visual-hierarchy` and `excessive-motion`
rules: on `crashed`, the trajectory + frozen rocket become the hero (they
*tell* the story), and the multiplier becomes a smaller "score" docked
top-left.

- Value wrapper switches from centered flex to `position: absolute; top: 16px; left: 24px`, row layout.
- Multiplier shrinks 128px → 56px, keeps red color + crash-shake.
- CRASHED badge sits inline next to the value.
- Replaces previous skull + double-ring + heavy overlay combo with a single
  expanding ring at the rocket's last position (`<CrashImpact />`) plus a
  brief 14% red flash.
- One-shot dock-to-corner spring animation (`scale 0.6 → 1.05 → 1`, 420ms).

## Crash history pills

- Each pill: 56px wide, 28px tall, radius `--radius-full`, font `display-pill`.
- Tier colored fill at 12% alpha; tier color text at 100%; tier border at 30%.
- New round prepends with `slide-in-left` (180ms, spring).

## Live bets feed

- Streams from existing socket events; new entry slides in from top.
- Cap visible: 8 rows. Older fade out below.
- Each row: avatar dot (initials), username, bet amount, status (live | cashed @ Nx | crashed).
- Cashed: green; crashed: red; live: orange.

## Reduced motion

- No parallax, no trail, no rocket flame flicker.
- Multiplier number still updates; crash flash becomes a single non-animated tint.
