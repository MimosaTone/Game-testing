# Meadow Defense

A relaxing 2D tower defense game focused on farming currency and upgrading defenses. Built with HTML5 Canvas and vanilla JavaScript (ES modules).

## Gameplay Loop

**Defeat enemies → Earn gold → Invest in economy → Upgrade towers → Survive stronger waves**

## How to Play

1. Open `index.html` in a browser, or run a local server:
   ```bash
   python3 -m http.server 8080
   ```
   Then visit http://localhost:8080

2. **Between waves** (unlimited planning time):
   - Select a tower or farm from the Build panel
   - Click a green tile to place it
   - Click placed structures to upgrade them
   - Press **Start Wave** when ready

3. **During waves**:
   - Towers automatically attack enemies on the path
   - Earn gold for each kill
   - Enemies that reach the end cost a life

4. **Farms** generate passive gold income at the end of each wave — upgrade them for more income.

## Features

- Single enemy path with strategic build spots
- Three tower types: Arrow (fast), Cannon (splash), Magic (long range)
- Farms with 6 upgrade levels for passive income
- Tower upgrades: damage, range, attack speed
- Scaling wave difficulty
- Minimal HUD: Gold, Lives, Wave, Income/Wave

## Architecture

The codebase is modular for easy extension:

```
js/
  config/     — Game balance data (towers, enemies, waves, farms)
  core/       — Game loop, economy, wave manager, event bus
  entities/   — Tower, Farm, Enemy, Projectile, Path
  systems/    — Combat, placement
  render/     — Canvas renderer
  ui/         — HUD and build panel
```

**Adding new content:**
- New tower: add entry to `config/towerTypes.js`
- New enemy: add entry to `config/enemyTypes.js`, reference in `config/waveConfig.js`
- New economy upgrade: extend `config/farmConfig.js` or add new structure config

No core system changes required.
