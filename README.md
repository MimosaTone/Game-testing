# Meadow Defense

A relaxing 2D tower defense game built around **satisfying economic progression**. Invest in Sunpatches, upgrade your defenses, and snowball into an unstoppable meadow fortress.

## Gameplay Loop

**Defeat invaders → Earn gold → Grow Sunpatches → Upgrade towers → Survive stronger waves**

The early game is generous — you can afford both defense and economy right away. Smart Sunpatch investments pay back quickly and compound over time through network bonuses and wave scaling.

## How to Play

```bash
python3 -m http.server 8080
```

Open http://localhost:8080

1. **Between waves** (unlimited planning time):
   - Place **Needle Posts**, **Boulder Pits**, or **Prism Spires** for defense
   - Plant **Sunpatches** for passive gold each wave — they pay back in ~2 waves
   - Click structures to upgrade them
   - Press **Start Wave** when ready

2. **During waves**: towers auto-attack; kills earn gold; leaks cost lives

3. **After each wave**: collect a harvest summary showing kill gold, Sunpatch income, and wave bonus

## Economy Design

| Mechanic | Purpose |
|----------|---------|
| **Generous start** (180g) | Afford a tower + Sunpatch immediately |
| **Strong Sunpatch ROI** | Level 1 pays back in ~2 waves |
| **Network bonus** | +12% income per additional Sunpatch |
| **Wave scaling** | +3.5% farm income per wave survived |
| **Wave clear bonus** | 25g + 12g per wave — never feel starved |

## Original Content

All mechanics, visuals, towers, enemies, and UI are original meadow-themed designs:

- **Towers:** Needle Post, Boulder Pit, Prism Spire, Gust Totem, Ember Hearth
- **Economy:** Sunpatch (passive harvest)
- **Invaders:** Mote, Drift, Husk, Titan, Ward, Rime
- **Bosses:** Briar Colossus, Gale Sovereign, Mire Ancient (every 15 waves)

## Tower Upgrade Paths

Each tower has a **5-tier sequential upgrade path** with unique power spikes:

| Tower | Path highlights |
|-------|----------------|
| **Needle Post** | Damage → Speed → Twin shot → Pierce → Needle Storm |
| **Boulder Pit** | Damage → Splash radius → Shrapnel → Slow → Avalanche |
| **Prism Spire** | Range/damage → Speed → Slow → Chain → Prism Cascade |
| **Gust Totem** | Slow aura → Damage → Knockback pulse → Range → Tempest |
| **Ember Hearth** | Burn DPS → Damage → Long burn → Spread → Inferno |

## Prestige (Wave 50+)

Reset your run to earn **Bloom Shards** for permanent upgrades: Sunpatch income, starting gold/lives, tower damage, and wave bonuses. Progress persists in localStorage.

## Boss Waves

Every 15th wave features a unique boss with special abilities and a large gold reward.

## Options

- **Auto-start waves** — toggle to automatically begin the next wave after a short delay
- **52 build spots** — expanded map for more strategic layouts

Late waves (10+) introduce **Ward** (armored) and **Rime** (regenerating) invaders, plus scaling armor and regen on all foes. Smart Sunpatch investment and tower upgrades are both required to survive.

## Architecture
js/
  config/     — Balance data (towers, enemies, waves, economy)
  core/       — Game loop, economy, wave manager, event bus
  entities/   — Tower, Farm, Enemy, Projectile, Path
  systems/    — Combat, placement
  render/     — Canvas renderer, floating text
  ui/         — HUD and build panel
```

Add new content via config files — no core rewrites needed.
