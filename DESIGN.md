# Army Commander — Game Design Document

**Version 1.0** — Locked design decisions. M2 implements the command layer per the milestone roadmap below. Features not listed in a milestone are out of scope until that milestone ships.

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
- **Issue battlefield orders** (hold, attack, defend, rally point, focus target — always available)
- **Activate commander abilities** (war cry, inspire, emergency retreat — CP-gated)
- **Reposition** to maintain bond cohesion with the companion
- **Read and respond** to scout reports and event warnings

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

### Command Resources — Hybrid System

**Design principle:** Reward tactical decision-making, not punish players for issuing orders. Basic battlefield communication should always feel available; only high-impact commander interventions carry resource cost.

Commands split into two tiers:

#### Tier 1: Battlefield Orders (always available)

Limited only by **short cooldowns** (1–3s) or brief **order animation** — never by Command Points.

| Order | Effect | Cooldown |
|---|---|---|
| **Hold** | Units stop and defend current position | 1.5s |
| **Attack** | Units pursue and engage nearest enemy | 1.5s |
| **Defend** | Units prioritize threats closest to commander | 2s |
| **Rally Point** | Units move to and hold a marked ground position | 2s |
| **Focus Target** | Units prioritize the marked enemy | 2s |

Players should be able to re-issue orders freely in response to battlefield changes. Cooldowns prevent visual/audio spam and give orders a moment of weight — not resource anxiety.

#### Tier 2: Commander Abilities (CP or long cooldown)

High-impact interventions that can swing a fight. Each ability costs **1–2 Command Points** *or* has a **meaningful cooldown** (15–45s) — never both unless the ability is intentionally run-defining.

| Ability | Effect | Cost |
|---|---|---|
| **War Cry** | Army damage +25% for 6s | 2 CP |
| **Inspire** | Restore morale; units obey faster and fight more aggressively for 8s | 1 CP |
| **Emergency Retreat** | All units break combat and sprint to commander | 2 CP, 30s cooldown |
| **Tactical Rally** | Units regroup at commander with brief damage reduction | 1 CP, 20s cooldown |

**Command Points:** Small pool (max 3–4), regenerate slowly (~1 CP per 20s). Doctrine can modify regeneration rate or ability costs — not basic order availability.

| Resource | Governs | Regenerates? |
|---|---|---|
| **Order Cooldowns** | Tier 1 battlefield orders | Per-order, 1–3s |
| **Command Points** | Tier 2 commander abilities | ~1 CP / 20s; faster near objectives |
| **Ability Cooldowns** | Emergency Retreat, Tactical Rally (even when CP available) | 15–45s per ability |
| **Doctrine Slots** | Permanent run modifiers chosen at milestones | Never — commitment is the point |

**Design rule:** The player should average one meaningful *ability* decision every 20–30 seconds, while issuing battlefield orders continuously as the fight demands. Constant micromanagement is encouraged at the order level; ability timing is where mastery lives.

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
| **Run Start** | Primary Doctrine (1 of 2 at launch; expand after core loop proves itself) | Defines the run's identity immediately |
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

**M2 ships two polished doctrines.** Wolfpack and Sacred Bond are designed but deferred until the core command loop proves fun. Two deep identities beat four shallow ones.

| Doctrine | Signature Mechanic | Strength | Limitation |
|---|---|---|---|
| **Shock Assault** | `Focus Fire` order: companion attacks marked target at +50% speed for 5s (Tier 1, 3s cooldown) | Burst elimination of priority targets | Defend order effectiveness reduced 30% |
| **Iron Wall** | `Hold Position` order: companion cannot be forced to retreat; gains damage reduction while holding | Objective defense, escort | Attack order disabled; movement speed reduced 20% |

### Future Doctrines (post–core loop)

Designed but not built until Shock Assault and Iron Wall feel distinct and fun in playtesting.

| Doctrine | Signature Mechanic | Strength | Limitation |
|---|---|---|---|
| **Wolfpack** | `Flank Order`: companion circles to target's rear for bonus damage | Kiting, assassinations, hit-and-run | Direct confrontation penalties; cohesion critical |
| **Sacred Bond** | Bond radius 2× larger; synchronization bonuses doubled when bonded | Safe commanding at range; strongest cohesion rewards | Severe desync penalties when separated (see Bond & Cohesion) |

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
- **Shock and Awe** — Focus Fire also stuns target for 1s, but costs 1 Command Point
- **No Retreat** — Attack order grants +30% speed, but Hold order is disabled entirely

---

## Bond & Cohesion

The bond between commander and companion is a **cohesion system**, not a stat buff. Separation should feel like losing a partner — not like a damage debuff ticking down.

### Bonded State (within bond radius)

- Companion responds to orders **immediately** (no obedience delay)
- Companion fights **aggressively** — pursues marked targets, holds formation
- Synergy bonuses active: +15% damage dealt, +10% damage reduction
- Visual: bond line glows; companion outline pulses in sync with commander

### Desynced State (bond broken)

When commander and companion separate beyond bond radius, the companion does not simply become weaker — it becomes **uncoordinated**:

| Effect | Behavior | Player Feeling |
|---|---|---|
| **Obedience delay** | Orders take 1.5–2s to execute instead of instant | "They're not hearing me" |
| **Defensive drift** | Companion prioritizes self-preservation over orders; won't pursue distant targets | "They're falling back on their own" |
| **Formation break** | Companion may stop following rally points to fight nearest threat | "I've lost control of the flank" |
| **No synergy bonuses** | Damage and DR buffs inactive | Tangible but secondary to behavior change |

**No primary damage penalty.** The companion is still dangerous — just not *yours* until you reunite.

### Resynchronization (re-entering bond radius)

- Brief **resync animation** (~0.5s) — companion turns toward commander
- Obedience instantly restored; synergy bonuses return
- Visual/audio cue: bond line reconnects, brief flash
- Optional: **Inspire** ability accelerates resync or grants temporary immunity to desync

**Design goal:** The player should think *"I need to get back to my partner"* — not *"my DPS dropped 20%."* Sacred Bond doctrine (future) amplifies both bonded rewards and desync penalties, making cohesion the central skill.

### Bond & Orders Interaction

| Order | Bonded Behavior | Desynced Behavior |
|---|---|---|
| **Focus Target** | Immediate focus, aggressive pursuit | Delayed; may attack closer threat instead |
| **Hold** | Holds firmly, gains DR bonus | Holds but won't hold for long; drifts defensive |
| **Attack** | Full-speed pursuit | Cautious advance, stops at mid-range |
| **Rally Point** | Moves directly to point | Slow pathing; may stop to fight en route |
| **Defend** | Intercepts threats to commander | Defends self first, commander second |

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
| **Key Decisions** | When to use abilities, when to Hold vs. Attack, bond positioning |
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

### Game Modes

| Mode | Objective Selection | Rewards | When |
|---|---|---|---|
| **Standard** | Player chooses commander, doctrine, and objective | Base progression | M2 launch |
| **Random** | Objective (and later: doctrine, enemy faction) assigned randomly | Bonus progression currency | Post–M3, once 3+ objectives exist |
| **Challenge** | Random objective + mutators (e.g. halved CP regen, faster events) | Highest progression rewards + cosmetics | Post–M6, once event + enemy systems exist |

Standard Mode is the default training ground. Random and Challenge reward players who can **adapt their command style** to unknown situations — the ultimate expression of the "better commander" pillar.

### Run Structure (Standard Mode)

At run start, the player chooses in this order:

```
1. Commander      → Who leads
2. Doctrine       → How they fight
3. Objective      → What victory means
4. Enemy Faction  → Who opposes you (assigned or chosen, post-M6)
```

This quadruple defines the run identity before a single shot is fired.

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

### M2: Command Layer + Doctrine ✅
- **Tier 1 orders:** Hold, Attack, Defend, Rally Point, Focus Target (cooldown-gated, no CP cost)
- **Tier 2 abilities:** War Cry, Tactical Rally (CP + cooldown); Emergency Retreat, Inspire (post-M2 polish)
- **Bond & Cohesion:** Desynced companion becomes uncoordinated (obedience delay, defensive drift) — not just stat penalty
- **Doctrine selection at run start** (2 doctrines: Shock Assault, Iron Wall)
- Doctrine modifies order effectiveness, not order availability
- **Standard Mode** run setup: choose doctrine + Survival objective
- Command Point pool for abilities only (max 3, ~1 CP / 20s regen)

**Playtest question:** Does choosing a doctrine change how you issue orders? Does desync feel like losing your partner?

### M3: First Battlefield Event + Second Objective
- **1 dynamic event:** Artillery Barrage (telegraphed zones, reposition or endure)
- **Annihilation objective** selectable in Standard Mode
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
- Wolfpack + Sacred Bond doctrines
- Random and Challenge game modes

---

## M1 Reference (Implemented)

### Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Move commander |
| Companion | Auto-follows, auto-attacks nearest enemy in range |
| R | Restart after win/loss |

### Synergy: Bond Radius (M1 baseline)

When commander and companion are within bond radius, both gain:
- +15% damage dealt
- +10% damage reduction

**M2 upgrade:** Bond becomes the Bond & Cohesion system (see above). M1's stat bonuses remain as the *bonded* state reward; separation triggers behavioral desync rather than a flat damage penalty.

---

## Resolved Design Decisions

| Question | Decision | Rationale |
|---|---|---|
| **Command Points vs. cooldowns** | Hybrid: orders use short cooldowns; abilities use CP + cooldown | Reward tactical orders without resource anxiety |
| **Doctrine count at launch** | 2 (Shock Assault, Iron Wall) | Polished identities over shallow variety |
| **Objective assignment** | Player choice in Standard Mode; Random + Challenge later | Learn command styles deliberately, then adapt under pressure |
| **Bond separation penalty** | Cohesion desync (obedience delay, defensive drift), not damage reduction | "I've lost my partner" > "my numbers went down" |
| **Event interruption** | Real-time with generous telegraph windows (15–30s) | Pressure without removing agency |

## Open Design Questions

Questions to resolve during M2 playtesting:

1. **CP pool size** — 3 CP max feels tense; 4 CP feels comfortable. Playtest both with Shock Assault's War Cry (2 CP).
2. **Desync obedience delay** — 1.5s may be too punishing for fast fights; 2s may be too forgiving. Tune per enemy wave speed.
3. **Resync feel** — Should reuniting have a brief vulnerability window (commitment to regrouping) or be purely rewarding?
4. **Order input scheme** — Hotkeys (1–5) vs. radial menu vs. click-to-order on map. Recommend hotkeys for M2, radial for mobile later.
