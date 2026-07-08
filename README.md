# Army Commander

A top-down action roguelite where you command an army — not become an overpowered hero.

**Milestone 3** — intelligent enemy roles stress-test the command layer.

## Quick Start

```bash
npm install
npm run dev
```

## M3: Command Trial

Survive 90 seconds or **defeat the Field Captain** (boss spawns ~40s).

### Enemy roles

| Role | Color | Forces you to... |
|---|---|---|
| Grunt | Red | Position; protect commander |
| Archer | Orange | Keep moving; break clusters |
| Bruiser | Dark red | Focus fire priority targets |
| Scout | Purple | Defend commander from flanks |
| Support | Green | Kill priority targets first |

### Controls (unchanged from M2)

| Input | Action |
|---|---|
| WASD | Move commander |
| 1–5 | Battlefield orders |
| Q / E | Commander abilities |
| RMB | Focus Target |

## Design

See [DESIGN.md](./DESIGN.md) (Version 1.5).
