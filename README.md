# Army Commander

A top-down action roguelite where you command an army — not become an overpowered hero.

**Milestone 2** — command layer, doctrines, and bond cohesion.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## M2 Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Move commander |
| 1–5 | Battlefield orders (Hold, Attack, Defend, Rally, Focus) |
| 4 + click | Place rally point on map |
| Right-click enemy | Focus Target |
| Q | War Cry (2 CP, +25% damage 6s) |
| E | Tactical Rally (1 CP, regroup + DR) |
| R | Return to setup after win/loss |

## Run Setup (Standard Mode)

1. Choose a **Doctrine** — Shock Assault or Iron Wall
2. **Survival** objective — hold for 90 seconds
3. Issue orders to your companion; stay in bond range for cohesion

## Bond & Cohesion

- **Bonded:** instant obedience, +15% damage, +10% DR
- **Desynced:** orders delayed, companion fights defensively on its own
- **Resyncing:** brief reconnection when you reunite

## Design

See [DESIGN.md](./DESIGN.md) (Version 1.0) for the full vision and milestone roadmap.

## Tech

- Phaser 3 + TypeScript + Vite
- Modular systems: `command/`, `cohesion/`, `doctrine/`, `objectives/`
