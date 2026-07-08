# Army Commander — Design Document

## Design Critique & Refinements

Honest feedback on the vision, with suggested improvements before we build.

### What's Strong (Keep This)

1. **Commander-as-weak-link philosophy** — Clear differentiation from survivor-likes where the avatar becomes a god. This is the game's identity.
2. **Evolution branching mid-run** — The killer feature. Each branch should change *how you play*, not just DPS numbers.
3. **Enemy commanders with personalities** — Better than anonymous difficulty scaling. Makes runs memorable.
4. **Objective variety** — Rewards different army compositions. Excellent replayability lever.
5. **Gameplay-first, placeholder art** — Correct priority for prototyping.

### Where I'd Push Back

#### 1. "Player is NOT the strongest unit" — Risk of feeling helpless

If the commander can't influence the fight directly, players become spectators watching AI fight. That's frustrating, not strategic.

**Refinement:** The commander is the *weakest combatant* but the *most impactful non-combatant*. Direct player actions should be:
- **Mark priority targets** (enemies focus your army on one threat)
- **Reposition the formation** (pull back, flank, protect a zone)
- **Activate commander abilities** (brief buffs, emergency shields, rally)
- **Issue stance commands** (aggressive / defensive / gather)

The fantasy is chess general, not cameraman.

#### 2. Adaptive Enemy AI — Ambitious, easy to get wrong

Full "analyze and hard-counter" AI often feels punitive and opaque. Players blame the game, not their decisions.

**Refinement:** Use **Pressure Axes**, not hard counters.

| Player Army Signal | Enemy Pressure (not counter) | Player Still Has Answers |
|---|---|---|
| High unit count | AoE, fire, explosives | Sacrifice units, spread formation, fast units |
| Elite single unit | Tanks, CC, shield break | Kite, add support minions, evolution split |
| Ranged-heavy | Assassins, fliers | Bodyguards, melee screen, focus fire |
| Melee-heavy | Artillery, poison zones | Ranged evolutions, hit-and-run |

**Key rules:**
- Never deploy a counter that has *zero* answers for the current army
- Show the enemy commander's "scouting report" — transparency builds trust
- Adaptation should escalate *variety*, not just stats

#### 3. Four Commanders at once — Four different games

Swarm Master (numbers), Conductor (formations), Beastmaster (creature identity), and Commander (elite bond) need different control schemes and UI. Building all four before proving one loop is risky.

**Refinement:** Ship **Commander (Elite Bond)** first. It tests the core fantasy with the simplest control model. Add Swarm Master in M3 once spawning/limits work. Conductor needs formation UI — save for M5+. Beastmaster is mostly content reskin once evolution system works.

#### 4. Corruptor faction — Cool but complex early

Stealing/converting units requires loyalty systems, stolen-unit AI, and player emotional investment in units. High complexity, high payoff — but not for early milestones.

**Refinement:** Phase in as M8+ faction. Early enemies: Warlord (elites), Hive Queen (swarm), Tactician (pressure axes).

#### 5. Between-run progression — Unlock options, not power

Permanent +10% damage trivializes run decisions. PoE-style unlock trees that add *choices* work better.

**Refinement:**
- Unlock new commanders, evolutions, maps, enemy factions
- Avoid raw stat inflation
- "New evolution branch available" > "+5% HP forever"

#### 6. Evolution branches must change inputs, not stats

Bad: Alpha Wolf (+50% damage)
Good: Alpha Wolf (one unit you micro with charge ability; Pack Wolves (4 units, spread command); Spirit Wolf (aura healer you position behind frontline))

Every evolution should answer: *What new decision does the player make each second?*

---

## Unique Identity (How We Avoid Cloning)

| Inspiration | What we take | What we reject | Our identity |
|---|---|---|---|
| Vampire Survivors | Run-based escalation, simple visuals | Avatar becomes overpowered | Army becomes overpowered, you stay weak |
| Brotato | Gameplay-first, stat choices | Solo character builds | Army composition builds |
| PoE2 minions | Synergy, specialization | Passive spectating | Active command + synergy |
| Pikmin | Army management, creature types | Puzzle-platforming | Combat roguelite pressure |
| Palworld | Companion identity | Base-building sim | Mid-run evolution identity |

**Our hook:** You don't build a character. You build a *military doctrine* that evolves under enemy pressure.

---

## Milestone Roadmap

Each milestone = playable prototype. Never move forward until the current one is fun.

### M1: Commander's First Battle ✅ (Current)
- Top-down movement, placeholder art
- Commander + 1 elite companion
- Companion auto-combat, follows player
- Proximity synergy buff (bond radius)
- Enemy waves, survival win condition (90 seconds)
- Basic HUD

**Playtest question:** Does commanding feel better than fighting directly?

### M2: Target & Stance Commands
- Mark priority target (right-click / key)
- Stances: Aggressive, Defensive, Follow
- Commander has 1 active ability (Rally)
- Simple evolution choice at 30s: +damage / +health / +speed

**Playtest question:** Do commands feel impactful?

### M3: Swarm Master Commander
- Second commander selectable at run start
- Multiple weak units, reproduction over time
- Unit cap, simple spawn rules
- Same survival objective

**Playtest question:** Does swarm feel different from elite bond?

### M4: Evolution System
- Branching evolution UI (2-3 choices per tier)
- Evolutions change behavior, not just stats
- First beastmaster-style branch: Guardian path

**Playtest question:** Do evolutions feel like new playstyles?

### M5: Pressure Axis Enemy AI
- Enemy composition reacts to army signals (unit count, range ratio)
- Enemy commander "scout report" UI
- Warlord + Hive Queen factions

### M6: Second Objective — Annihilation
- Kill all enemies on map
- Different map layout, encourages aggressive builds

### M7: Domination / Escort Objectives
- Capture points, escort NPC
- Objective selection at run start

### M8: Between-Run Meta
- Unlock commanders, evolutions, maps
- Save system (localStorage)
- No raw stat inflation

### M9+: Remaining commanders, factions, content
- Conductor formations, Beastmaster creatures
- Corruptor, Tactician, Extraction, Assassination
- Equipment, random events

---

## M1 Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Move commander |
| Companion | Auto-follows, auto-attacks nearest enemy in range |
| — | (M2 adds targeting and stances) |

## M1 Synergy: Bond Radius

When commander and companion are within bond range, both gain:
- +15% damage dealt
- +10% damage reduction

This rewards positioning the commander near the fight without being the fighter.
