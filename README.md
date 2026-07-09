# Harvest Defense

A relaxing 2D tower defense game focused on farming currency and upgrading defenses.

**Gameplay loop:** Defeat enemies → Earn gold → Invest in economy → Upgrade towers → Survive stronger waves.

## How to Play

1. Open `index.html` in a modern browser (or serve locally — see below).
2. Build **Arrow**, **Cannon**, and **Magic** towers along the path to defend.
3. Build **Farms** on open tiles for passive gold income each wave.
4. Click **Start Wave** when ready — between waves you have unlimited planning time.
5. Click placed buildings to upgrade damage, range, attack speed (towers) or income (farms).
6. Survive **20 waves** to win.

## HUD

- **Gold** — spend on buildings and upgrades; earn from kills and farms
- **Lives** — enemies that reach the end cost 1 life
- **Wave** — current wave / total waves
- **Income / Wave** — total farm income collected when each wave ends

## Local Server

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` (ES modules require a local server in most browsers).

## Architecture

Modular ES modules make it easy to add content without rewriting core systems:

```
js/
  config/          # Data definitions (towers, enemies, farms, waves)
  entities/        # Tower, Farm, Enemy, Projectile
  systems/         # Path, Economy, Waves, Combat, Building
  ui/              # HUD and build/upgrade panels
  game.js          # Orchestrator and game loop
  main.js          # Entry point
```

**Adding a new tower:** define it in `js/config/towerTypes.js` — the build panel and combat systems pick it up automatically.

**Adding a new enemy:** define it in `js/config/enemyTypes.js` and reference it in wave recipes in `js/config/waveConfig.js`.

**Adding economy upgrades:** extend `js/config/farmTypes.js` or add new building categories via `js/systems/building.js`.

## Tech

- HTML5 Canvas
- Vanilla JavaScript (ES modules)
- No build step required
