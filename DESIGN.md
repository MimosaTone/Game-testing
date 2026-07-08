# Army Commander — Design Document

## Core Pillars

These four pillars define every system we build. If a feature doesn't serve at least one pillar, it doesn't ship.

| Pillar | Player Fantasy | Design Test |
|---|---|---|
| **Command, Not Combat** | "I win through decisions, not damage" | Does this add a decision the player makes? |
| **Doctrine Identity** | "I committed to a philosophy of war" | Does this permanently change *how* the army behaves? |
| **Living Battlefield** | "The fight evolves around me" | Does this force adaptation mid-run? |
| **Objective-Driven Command** | "My orders depend on the mission" | Does this reward a different style of leadership? |

**Anti-pillar:** Surviving escalating waves while auto-attacking is a *vehicle* for testing systems, not the game's identity. Wave survival alone must never be the primary experience.

---

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

#### 7. Doctrine must be commitment, not a menu of buffs

If doctrines are "+10% to X" with no tradeoff, they're disguised stat picks. Every doctrine should **enable** a playstyle and **disable or weaken** another.

**Refinement:** Each doctrine has 1 signature strength, 1 meaningful limitation, and 1 unique command or mechanic. Players should think "I'm running Shock Doctrine *this run*" — not "I picked the damage option."

#### 8. Battlefield events must create decisions, not noise

Random explosions and spawn floods are chaos, not strategy. Events need a **warning phase**, a **choice or response window**, and a **lasting consequence**.

**Refinement:** Every event follows: *Signal → Decision → Consequence*. If the player can't do anything about it, it's a cutscene, not an event.

---

## Unique Identity (How We Avoid Cloning)

| Inspiration | What we take | What we reject | Our identity |
|---|---|---|---|
| Vampire Survivors | Run-based escalation, simple visuals | Avatar becomes overpowered | Army becomes overpowered, you stay weak |
| Brotato | Gameplay-first, stat choices | Solo character builds | Army composition builds |
| PoE2 minions | Synergy, specialization | Passive spectating | Active command + synergy |
| Pikmin | Army management, creature types | Puzzle-platforming | Combat roguelite pressure |
| Palworld | Companion identity | Base-building sim | Mid-run evolution identity |

**Our hook:** You don't build a character. You build a *military doctrine* that evolves under enemy pressure on a battlefield that won't stay still.

---

## The Command Loop

Every run should cycle through this loop. Wave survival is just one way to apply pressure inside it.

```
ASSESS → COMMIT → EXECUTE → ADAPT → (repeat)
```

| Phase | What Happens | Player Action |
|---|---|---|
| **Assess** | Scout reports, event warnings, objective status | Read the battlefield, identify threats and opportunities |
| **Commit** | Doctrine effects, stance selection, evolution choice | Make irreversible or costly decisions |
| **Execute** | Army carries out orders, commander repositions | Mark targets, activate abilities, manage formation |
| **Adapt** | Enemy responds, events resolve, casualties mount | Change approach without abandoning doctrine identity |

### Command Resources

To prevent spam and make orders feel weighty, the commander operates on limited **Command Points (CP)** or ability cooldowns:

| Resource | Purpose | Regenerates? |
|---|---|---|
| **Command Points** | Stance changes, target marks, formation shifts | Slowly over time; faster near objectives |
| **Rally / Ability** | Burst commands with long cooldown | On cooldown only |
| **Doctrine Slots** | Permanent run modifiers chosen at milestones | Never — commitment is the point |

**Design rule:** The player should average one meaningful command decision every 10–20 seconds. Not constant micromanagement, not idle spectating.

### What Makes a Decision "Strategic"

A strategic decision has all three:
1. **Information** — player knew *something* before choosing (scout report, event warning, visible threat)
2. **Tradeoff** — choosing A means not choosing B
3. **Consequence** — the choice matters 30+ seconds later

Examples:
- *Strategic:* "Enemy artillery is deploying northeast. I pull my swarm back and mark the artillery — but I abandon the capture point."
- *Not strategic:* "I picked +5% damage."

---

## Doctrine System

**Doctrine** is the run-defining military philosophy. Unlike evolutions (unit changes) or equipment (gear), doctrine permanently alters **how you command** for the entire run.

### When Doctrine Is Chosen

| Timing | What | Why |
|---|---|---|
| **Run Start** | Primary Doctrine (1 of 3–4 available per commander) | Defines the run's identity immediately |
| **Mid-Run (~2 min)** | Doctrine Amendment (pick 1 modifier from a doctrine-specific list) | Deepens commitment without full respec |
| **Never** | Full doctrine respec | Commitment is the pillar — adapt within your doctrine, don't swap it |

### Doctrine Structure

Each doctrine has:

```
DOCTRINE
├── Signature Mechanic    (unique command or army behavior)
├── Strength              (what you're great at)
├── Limitation            (what you give up)
├── Preferred Objectives  (bonus or synergy, not hard requirement)
└── Amendment Pool        (mid-run modifiers that stack with identity)
```

### Launch Doctrines (Commander — Elite Bond)

| Doctrine | Signature Mechanic | Strength | Limitation |
|---|---|---|---|
| **Shock Assault** | `Focus Fire` command: all units attack marked target at +50% speed for 5s | Burst elimination of priority targets | Defensive stances are 30% weaker |
| **Iron Wall** | `Hold Position`: companion cannot be forced to retreat; gains damage reduction while stationary | Objective defense, escort | Movement speed reduced 20%; aggressive stance disabled |
| **Wolfpack** | `Flank Order`: companion circles to target's rear for bonus damage | Kiting, assassinations, hit-and-run | Direct confrontation penalties; bond range must be maintained |
| **Sacred Bond** | Bond radius is 2× larger; bond bonuses are doubled | Safe commanding at range | Companion deals 20% less damage when bond is inactive |

### Doctrine vs. Evolution vs. Commander

| Layer | Scope | Permanence | Example |
|---|---|---|---|
| **Commander** | Who you are | Per run (chosen at start) | Elite Bond, Swarm Master |
| **Doctrine** | How you fight | Per run (locked at start + 1 amendment) | Shock Assault, Iron Wall |
| **Evolution** | What your army becomes | Per run (branching choices at milestones) | Alpha Wolf, Pack Wolves |
| **Equipment** | Gear modifiers | Per run (swappable at camps) | Banner of Haste, Shield Generator |

**Interaction rule:** Doctrine shapes *commands*. Evolution shapes *units*. They should synergize but not duplicate. Shock Assault + Alpha Wolf = assassination machine. Iron Wall + Pack Wolves = awkward — and that's fine. Doctrine mismatch is a skill expression layer.

### Amendment Examples (Mid-Run, Shock Assault)

- **Overwhelming Strike** — Focus Fire cooldown halved, but companion takes 15% more damage during Focus Fire
- **Shock and Awe** — Focus Fire also stuns target for 1s, but costs 2 Command Points
- **No Retreat** — Companion speed +30%, but Defensive stance is removed entirely

---

## Dynamic Battlefield Events

Events transform the arena during a run. They are the battlefield's way of refusing to let the player settle into one strategy.

### Event Design Rules

1. **Telegraph** — player sees it coming (15–30s warning minimum)
2. **Decision** — player can respond (reposition, commit resources, accept risk)
3. **Consequence** — battlefield state changes persistently until the run ends or another event reverses it
4. **Frequency** — 1 event every 60–90 seconds on average; never overlap more than 2 active events

### Event Categories

#### Terrain Events (change the map)

| Event | Signal | Decision | Consequence |
|---|---|---|---|
| **Artillery Barrage** | Red zones appear on map | Evacuate units or endure | Zones deal damage over time; persist 45s |
| **Bridge Collapse** | Cracking animation, timer | Rush crossing or find alternate route | Map connectivity changes permanently |
| **Fog of War** | Visibility shrinks at edges | Scout forward or hold position | Enemy reinforcements spawn in fog |
| **Supply Depot** | Neutral crate appears | Send units to capture or ignore | Capturing grants evolution point; ignoring lets enemies take it |

#### Faction Events (new actors enter)

| Event | Signal | Decision | Consequence |
|---|---|---|---|
| **Enemy Reinforcements** | Horn + direction indicator | Intercept column or fortify | Reinforcements arrive if not stopped |
| **Mercenary Offer** | NPC approaches commander | Hire (costs resources) or refuse | Temporary allied unit joins |
| **Civilian Evacuation** | Civilians cross battlefield | Protect (escort bonus) or ignore (morale penalty) | Affects resources and event outcomes |
| **Rival Commander Arrives** | Named enemy enters with unique squad | Assassinate now or survive their push | New elite threat on field |

#### Opportunity Events (risk/reward)

| Event | Signal | Decision | Consequence |
|---|---|---|---|
| **Weak Point Spotted** | Scout report highlights enemy flank | Commit forces to exploit or stay on objective | Bonus damage window or wasted repositioning |
| **Overextended Enemy** | Enemy army splits | Pursue stragglers or hold ground | Kills vs. objective progress tradeoff |
| **Evolution Catalyst** | Glowing artifact spawns | Send companion to retrieve (vulnerable) or continue fighting | Instant evolution choice unlocked |

### Event ↔ Doctrine Interaction

Events should reward different doctrines without hard-counters:

| Event | Favored Doctrine | Why |
|---|---|---|
| Artillery Barrage | Wolfpack (mobility) | Can evacuate and re-engage |
| Hold the Line | Iron Wall | Built for zone defense |
| Enemy Reinforcements | Shock Assault | Intercept column with Focus Fire |
| Civilian Evacuation | Iron Wall / Sacred Bond | Protection and range |

**Key rule:** Any doctrine can survive any event — but the *cost* of surviving differs. That's strategic texture.

### Event ↔ Enemy Commander Interaction

Enemy commanders can **trigger** events as part of their personality:

| Enemy Commander | Signature Event |
|---|---|
| **Warlord** | Elite Vanguard — deploys champion unit at frontline |
| **Hive Queen** | Brood Surge — spawns swarms from multiple directions |
| **Tactician** | Feint — fake reinforcement signal, real attack elsewhere |
| **Beast Lord** | Stampede — terrain hazard charges across map |
| **Corruptor** | Defection Offer — attempts to steal weakest unit |

---

## Objectives & Command Styles

Objectives are not just win conditions — they are **command philosophies under pressure**. Each objective should make the player issue different orders to the same army.

### Objective Design Framework

Every objective defines:

```
OBJECTIVE
├── Primary Goal          (what victory requires)
├── Command Style         (how a good commander behaves)
├── Army Composition Bias (what tends to work, not what's required)
├── Doctrine Synergy      (which doctrines have natural advantage)
├── Event Weighting       (which battlefield events appear more often)
└── Failure Mode          (how runs typically end when player misfires)
```

### Launch Objectives

#### Survival
*"Hold the line until relief arrives."*

| Aspect | Detail |
|---|---|
| **Command Style** | Reactive — respond to waves, manage casualties, conserve resources |
| **Key Decisions** | When to use Rally, when to retreat vs. hold, bond positioning |
| **Army Bias** | Sustain, damage reduction, regeneration |
| **Doctrine Synergy** | Iron Wall, Sacred Bond |
| **Failure Mode** | Death by attrition — army slowly ground down |

#### Annihilation
*"Leave no enemy standing."*

| Aspect | Detail |
|---|---|
| **Command Style** | Aggressive — push forward, mark priority targets, accept casualties |
| **Key Decisions** | Target priority (artillery first? elites first?), when to commit Rally |
| **Army Bias** | High damage, focus fire, mobility |
| **Doctrine Synergy** | Shock Assault, Wolfpack |
| **Failure Mode** | Overextension — army scattered, picked apart by reinforcements |

#### Domination
*"Control the battlefield."*

| Aspect | Detail |
|---|---|
| **Command Style** | Territorial — split forces, rotate defenders, time captures |
| **Key Decisions** | Which points to hold vs. contest, when to abandon a point |
| **Army Bias** | Unit count, zone control, split formations |
| **Doctrine Synergy** | Iron Wall (hold), Swarm Master (spread) |
| **Failure Mode** | Spread too thin — lose all points simultaneously |

#### Escort
*"Get them home alive."*

| Aspect | Detail |
|---|---|
| **Command Style** | Protective — bodyguard positioning, intercept threats before they reach VIP |
| **Key Decisions** | Screen vs. clear path, sacrifice units to save VIP |
| **Army Bias** | Taunt tanks, interceptors, damage reduction auras |
| **Doctrine Synergy** | Iron Wall, Sacred Bond |
| **Failure Mode** | VIP exposed — player chased kills while escort dies |

#### Extraction
*"Take what you can, then get out."*

| Aspect | Detail |
|---|---|
| **Command Style** | Risk management — how long to stay, what to grab, when to run |
| **Key Decisions** | "One more crate" vs. extract now, split army between gather and guard |
| **Army Bias** | Fast units, gatherers, mobile extraction |
| **Doctrine Synergy** | Wolfpack, Shock Assault (hit and run) |
| **Failure Mode** | Greed — stayed too long, extraction window closes |

#### Assassination
*"Cut off the head."*

| Aspect | Detail |
|---|---|
| **Command Style** | Surgical — penetrate lines, ignore distractions, commit to the kill |
| **Key Decisions** | Path to commander (flank? brute force?), when to burn abilities |
| **Army Bias** | Burst damage, assassins, ignore fodder |
| **Doctrine Synergy** | Shock Assault, Wolfpack |
| **Failure Mode** | Endless fodder — killed by reinforcements before reaching target |

### Run Structure: Objective Selection

At run start, the player chooses (or is assigned) in this order:

```
1. Commander      → Who leads
2. Doctrine       → How they fight
3. Objective      → What victory means
4. Enemy Faction  → Who opposes you (with commander personality)
```

This quadruple defines the run identity before a single shot is fired.

**Roguelite variance:** Objective can be random with a "reroll" option (costs a resource), or player-selected with harder objectives granting better rewards.

### Multiple Answers Principle

No objective should have only one viable army composition. The table below shows that each objective has at least two distinct viable approaches:

| Objective | Approach A | Approach B |
|---|---|---|
| Survival | Turtle with Iron Wall + sustain evolutions | Kite with Wolfpack + kill enemies before they reach you |
| Annihilation | Shock Assault focus-fire elites | Swarm overwhelm with numbers |
| Domination | Iron Wall hold one point, contest others | Swarm flood all points, accept losses |
| Escort | Iron Wall screen in front of VIP | Shock Assault clear path aggressively |
| Extraction | Wolfpack grab-and-run | Swarm gather while elites defend |
| Assassination | Wolfpack flank to commander | Shock Assault brute-force through center |

---

## System Interaction Map

How the four pillars connect during a run:

```
┌─────────────┐     defines      ┌──────────────┐
│  COMMANDER  │ ───────────────→ │   DOCTRINE   │
│  (who)      │                  │  (how)       │
└─────────────┘                  └──────┬───────┘
                                        │ shapes commands
┌─────────────┐     pressures    ┌──────▼───────┐
│  OBJECTIVE  │ ←─────────────── │   ARMY       │
│  (why)      │ ───────────────→ │  (evolutions)│
└──────┬──────┘   rewards style  └──────┬───────┘
       │                                │
       │ triggers                       │ targeted by
       ▼                                ▼
┌─────────────┐     responds     ┌──────────────┐
│  BATTLEFIELD│ ←─────────────── │    ENEMY       │
│  EVENTS     │                  │  COMMANDER    │
└─────────────┘                  └──────────────┘
```

**Example run:**
> Commander: Elite Bond → Doctrine: Shock Assault → Objective: Assassination → Enemy: Tactician
>
> You focus-fire through fodder, ignore a Feint event (scout report warned you), use Wolfpack amendment to flank the enemy commander, and win before Brood Surge arrives. Every system contributed a decision.

---

## Milestone Roadmap

Each milestone = playable prototype. Never move forward until the current one is fun.

### M1: Commander's First Battle ✅
- Top-down movement, placeholder art
- Commander + 1 elite companion
- Companion auto-combat, follows player
- Proximity synergy buff (bond radius)
- Enemy waves, survival win condition (90 seconds)
- Basic HUD

**Playtest question:** Does commanding feel better than fighting directly?

### M2: Command Layer + Doctrine
- Mark priority target (right-click / key)
- Stances: Aggressive, Defensive, Follow
- Commander Rally ability (cooldown-based)
- **Doctrine selection at run start** (2 doctrines: Shock Assault, Iron Wall)
- Doctrine effects on stances and commands
- Command Point system (limited stance changes)
- Survival objective remains, but reframed with doctrine choice

**Playtest question:** Does choosing a doctrine change how you play the same objective?

### M3: First Battlefield Event + Second Objective
- **1 dynamic event:** Artillery Barrage (telegraphed zones, reposition or endure)
- **Annihilation objective** selectable at run start
- Event warning UI (countdown + map indicator)
- Doctrine × objective synergy visible in HUD

**Playtest question:** Do events force meaningful repositioning decisions?

### M4: Evolution System + Amendment
- Branching evolution UI (2–3 choices per tier)
- Evolutions change behavior, not just stats
- **Doctrine Amendment** at 60s mark
- First evolution tier at 30s

**Playtest question:** Do evolutions + doctrine amendment feel like deepening a commitment?

### M5: Swarm Master + Domination
- Second commander selectable at run start
- Multiple weak units, reproduction over time
- **Domination objective** (1–2 capture points)
- Second battlefield event: Supply Depot (risk/reward capture)

**Playtest question:** Does swarm + domination feel like a different command style than elite bond + survival?

### M6: Enemy Commanders + Pressure Axes
- Enemy composition reacts to army signals (unit count, range ratio)
- Enemy commander "scout report" UI
- Warlord + Hive Queen factions with signature events
- Tactician Feint event

**Playtest question:** Does enemy adaptation feel fair and readable?

### M7: Escort + Extraction Objectives
- Escort VIP across map
- Extraction with risk/reward timer
- Civilian Evacuation event
- Mercenary Offer event

### M8: Between-Run Meta
- Unlock commanders, doctrines, evolutions, maps
- Save system (localStorage)
- Unlock options, not power

### M9+: Remaining content
- Conductor formations, Beastmaster creatures
- Corruptor, Beast Lord factions
- Assassination objective
- Equipment system, full event pool
- All doctrines per commander

---

## M1 Reference (Implemented)

### Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Move commander |
| Companion | Auto-follows, auto-attacks nearest enemy in range |
| R | Restart after win/loss |

### Synergy: Bond Radius

When commander and companion are within bond range, both gain:
- +15% damage dealt
- +10% damage reduction

This rewards positioning the commander near the fight without being the fighter.

---

## Open Design Questions

Questions to resolve during M2–M3 playtesting:

1. **Command Points vs. cooldowns** — Should stance changes cost CP, or only abilities? CP adds tension but may feel restrictive early.
2. **Doctrine count at launch** — 2 doctrines (faster to build) or 4 (more replayability)? Recommend 2 for M2, expand to 4 by M5.
3. **Objective assignment** — Player choice (more control) or random (more roguelite)? Recommend player choice with optional random for bonus rewards.
4. **Event interruption** — Can the player pause/command during event warnings, or is it real-time pressure only? Recommend real-time with generous telegraph windows.
5. **Bond synergy under Sacred Bond doctrine** — Does doubling bond range make the commander too safe? May need damage tradeoff (already designed in).
