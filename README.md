# Army Commander

A top-down action roguelite where you command an army — not become an overpowered hero.

**Milestone 1** — playable survival prototype.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## M1 Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Move commander |
| R | Restart after win/loss |

Your **companion** auto-follows and auto-attacks. Stay within bond range for synergy bonuses.

## Win / Lose

- **Win:** Survive 90 seconds
- **Lose:** Commander dies (companion alone cannot win the run)

## Design

See [DESIGN.md](./DESIGN.md) for full vision, design critique, and milestone roadmap.

## Tech

- Phaser 3 + TypeScript + Vite
- Placeholder art (colored circles)
- Browser-based, no install required for players
