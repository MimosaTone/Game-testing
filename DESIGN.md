# Army Commander — Game Design Document

**Version 1.6** — M3 enemy roster refined: Assassin + Siege replace Grunt; each role forces a unique command decision.

## Core Pillars

These four pillars define every system we build. If a feature doesn't serve at least one pillar, it doesn't ship.

| Pillar | Player Fantasy | Design Test |
|---|---|---|
| **Command, Not Combat** | "I win through decisions, not damage" | Does this add a decision the player makes? |
| **Doctrine Identity** | "I committed to a philosophy of war" | Does this permanently change *how* the army behaves? |
| **Living Battlefield** | "The fight evolves around me" | Does this force adaptation mid-run? |
| **Objective-Driven Command** | "My orders depend on the mission" | Does this reward a different style of leadership? |
| **Instrument of Command** | "My tool shapes how I lead" | Does this create a unique decision every few seconds? |

**Anti-pillar:** Surviving escalating waves while auto-attacking is a *vehicle* for testing systems, not the game's identity. **Command instruments that primarily increase commander damage, or that only change attack animations, are also anti-pillars.** The player leads an army — they do not swing a different stick.

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

#### 9. Command Instruments must not become damage sticks

If a Greatsword gives the commander +30% attack damage, it's a disguised stat weapon — the same failure mode as overpowered hero survivor-likes.

**Refinement:** Instruments create **recurring battlefield decisions** and **active leadership interactions** — not commander DPS or alternate attack animations. The instrument must answer: *"What unique decision does this commander make every few seconds?"*

#### 10. Instruments and Doctrines will overlap if poorly scoped

Greatsword sounds aggressive; Shock Assault is aggressive. Without separation, players pick matching pairs every run and ignore the rest.

**Refinement:**
- **Doctrine** = strategic philosophy (what you commit to for the run)
- **Command Instrument** = leadership medium (how your commands propagate to the army)

The same doctrine should play differently with different instruments. Shock Assault + Longbow = aggressive focus fire from the rear. Shock Assault + Greatsword = aggressive focus fire from the front. Same philosophy, different command style.

---

## Unique Identity (How We Avoid Cloning)

| Inspiration | What we take | What we reject | Our identity |
|---|---|---|---|
| Vampire Survivors | Run-based escalation, simple visuals | Avatar becomes overpowered | Army becomes overpowered, you stay weak |
| Brotato | Gameplay-first, stat choices | Solo character builds | Army composition builds |
| PoE2 minions | Synergy, specialization | Passive spectating | Active command + synergy |
| Pikmin | Army management, creature types | Puzzle-platforming | Combat roguelite pressure |
| Palworld | Companion identity | Base-building sim | Mid-run evolution identity |

**Our hook:** You don't build a character. You build a *military doctrine* expressed through a *command instrument* — and both evolve under enemy pressure on a battlefield that won't stay still.

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

### Doctrine vs. Evolution vs. Commander vs. Instrument

| Layer | Scope | Permanence | Example |
|---|---|---|---|
| **Commander** | Who you are | Per run (chosen at start) | Elite Bond, Swarm Master |
| **Doctrine** | How you fight | Per run (locked at start + 1 amendment) | Shock Assault, Iron Wall |
| **Command Instrument** | How you lead | Per run (chosen at start) | Longbow, Battle Banner |
| **Evolution** | What your army becomes | Per run (branching choices at milestones) | Alpha Wolf, Pack Wolves |
| **Army Equipment** | Unit gear modifiers | Per run (swappable at camps, future) | Banner of Haste |

**Interaction rule:** Doctrine shapes *commands*. Instrument shapes *command propagation*. Evolution shapes *units*. They should synergize but not duplicate.

### Amendment Examples (Mid-Run, Shock Assault)

- **Overwhelming Strike** — Focus Fire cooldown halved, but companion takes 15% more damage during Focus Fire
- **Shock and Awe** — Focus Fire also stuns target for 1s, but costs 1 Command Point
- **No Retreat** — Attack order grants +30% speed, but Hold order is disabled entirely

---

## Command Instruments

The commander's equipped **command instrument** is their tool of leadership — not a weapon. It defines **what the commander actively does on the battlefield** to direct the army.

Instruments do not exist to modify damage output. They exist to create **unique, recurring decisions** that make the player feel like a commander issuing intent, reading the field, and shaping the fight — not a hero with a different attack animation.

### The Instrument Design Test

Every instrument must answer:

> **"What unique decisions does this commander make every few seconds?"**

| Pass | Fail |
|---|---|
| "Do I reposition my banner before the flank collapses?" | "Do I use the sword attack or bow attack?" |
| "Which threat do I designate as priority fire?" | "Does my weapon do +15% damage?" |
| "Do I advance my influence zone or hold this ground?" | "My commander has a longer-range basic attack" |

### Design Rules

1. **Active battlefield interaction required** — every instrument gives the commander something to *do* beyond moving and auto-attacking
2. **Commander damage stays negligible** — utility effects only (mark, reveal, taunt, zone creation)
3. **Decisions, not stats** — instruments create recurring tactical choices every 10–20 seconds
4. **Army executes; commander directs** — the instrument never replaces unit combat with commander combat
5. **Instruments pair with doctrines, not duplicate them** — doctrine is *what* you believe; instrument is *how* you read and shape the battlefield
6. **Ship two polished instruments** at debut — same rule as doctrines

### Instrument Structure

```
INSTRUMENT
├── Core Decision Loop     (what the player evaluates every 10–20s)
├── Active Interactions    (instrument-specific actions beyond Tier 1 orders)
├── Battlefield Effect     (how the commander changes the map or unit behavior)
├── Order Expression       (how standard orders propagate differently)
├── Positioning Incentive  (where the commander should be to lead effectively)
└── Limitation             (what this instrument cannot do well)
```

---

### Longbow — Target Designation & Battlefield Awareness

**Core fantasy:** The commander is the army's eyes. You do not win by shooting — you win by **seeing** and **pointing**.

**Decision loop (every 10–20s):**
- Which enemy is the greatest threat *right now*?
- Do I have line of sight to issue clean designations?
- Should I shift priority as the battlefield changes?
- Am I positioned to observe without exposing the command chain?

**Active interactions:**

| Action | Input | Effect | Damage |
|---|---|---|---|
| **Designate** | RMB on enemy / Focus order | Priority mark with **threat tier**; uses **Designation Range** (not Bond Range) | None |
| **Scout Report** | Ability bar (cooldown-only) | Generates **battlefield intelligence** (see below) — not a map reveal | None |
| **Signal Arrow** | Click ground (short CD) | **Non-damaging** marker bolt; soft Rally ping toward location | Negligible |

#### Scout Report *(locked name)*

Renamed from "Survey." Chosen over Scout / Recon / Battlefield Recon because it matches existing commander language ("scout reports" from enemy commanders) and reinforces the **intelligence officer** fantasy.

**Input:** Commander Ability on the **ability bar** — not a held key (`Tab`). Keeps all commander actions in one interface; supports keyboard, controller, and future mobile; leaves room for upgrades.

**Cost:** **Cooldown-only** at debut (no CP cost). Scouting should not feel expensive early — intelligence gathering is core to the Longbow loop. If Scout Report becomes spammy in playtesting, add 1 CP cost later without changing the ability's function.

**Output:** Battlefield **intelligence**, not fog-of-war removal. Each Scout Report presents 1–3 actionable insights drawn from current battlefield state:

| Intelligence Type | Example | Decision It Enables |
|---|---|---|
| **Enemy Commander identified** | "Warlord elite squad northeast" | Prepare focus fire or avoidance |
| **Largest threat** | "Brute unit approaching companion" | Reposition or Defend |
| **Incoming reinforcements** | "Reinforcements arriving east in 15s" | Intercept or fortify |
| **Weak flank** | "Enemy left flank exposed" | Flank order or exploitation |
| **Nearby objective** | "Capture point undefended" | Contest or ignore |
| **Elite detected** | "Elite marker on artillery" | Priority designation |

**Design rules:**
- Intelligence must be **actionable** — tied to a decision the player can take with existing orders
- Scout Report does not permanently reveal the map — it delivers a **report** (UI panel + optional world ping)
- Using Scout Report before Designate grants **bonus obedience** on the next Focus (reward for assess → execute loop)
- Upgrade path (future): more insights per report, longer intel duration, enemy commander tells

**Battlefield awareness mechanics:**
- Threat indicators persist on designated targets until changed
- Scout Report intel expires after 10–15s — player must re-scout as battlefield shifts
- HUD threat vectors toward companion/objective when intel is active

**Order expression:**
- Focus Target uses **Designation Range**
- Other orders use **Command Range** (extended for Longbow, separate from Bond)
- Commander does **not** need to be in melee for designation
- Orders issued while commander is surrounded have +1s obedience delay

**Bond interaction:**
- Long designation range does **not** extend Bond Range
- Player can mark threats from afar but must still manage companion synchronization separately
- Rear command is viable — not a bypass of cohesion tension

**Limitation:** No frontline authority. Surrounded commander loses designation clarity. Bond still matters.

**What it is NOT:** A ranged DPS weapon or a map hack. The arrow is a signal; Scout Report is intelligence.

---

### Battle Banner — Positioning, Morale & Areas of Influence

**Core fantasy:** The commander is a **presence** on the battlefield. You do not strike — you **hold ground** and the army fights harder for it.

**Decision loop (every 10–20s):**
- Where should my **influence zone** be to support the current objective?
- Do I move forward to extend morale coverage, or hold position to anchor defense?
- Is my army fighting inside my banner's influence, or have they outrun my leadership?
- When do I **relocate** the banner vs. commit to this ground?

**Active interactions:**

| Action | Input | Effect | Damage |
|---|---|---|---|
| **Plant Banner** | Key `F` | Creates **Influence Zone** centered on commander | None |
| **Rally Cry** | `Q` (replaces War Cry) | Units inside zone: obedience speed + damage for 6s | None |
| **Hold the Line** | `E` (replaces Tactical Rally) | Zone fortified 4s — resist displacement + DR | None |

#### Banner Relocation *(locked behavior)*

When the commander moves beyond a threshold distance, the banner enters a **0.5s setup period** to relocate.

| During Setup | Commander |
|---|---|
| Influence zone **inactive** (no morale buffs) | **Fully responsive** — can move, issue orders, use abilities |
| Previous zone benefits **lost temporarily** | Not stunned, not punished |

**Decision created:** *"Do I keep my current morale zone, or sacrifice it briefly to reposition for stronger advantage?"*

This is a **tactical tradeoff**, not a punishment. No damage vulnerability, no control lockout. The cost is temporary loss of influence — the player chooses when that cost is worth paying.

**Area of influence mechanics:**
- Influence zone visible when active (colored ground ring, banner sprite)
- **Inactive during 0.5s setup** — clear visual (dimmed ring, planting animation)
- Units inside active zone: faster obedience, morale regen (future)
- Units outside zone: normal behavior, no penalty
- Commander **cannot attack**. No weapon animation.
- CP regenerates faster while 2+ allied units inside **active** zone

**Order expression:**
- Rally Point placed **inside** influence zone has 2× effect radius
- Hold order issued while banner is planted makes zone **sticky** (companion/units resist being pulled out)
- Attack order has no banner bonus — banner commanders lead by presence, not aggression

**Limitation:** Commander must remain near the fight to maintain influence. Hiding far from the army nullifies the instrument. Vulnerable during relocation.

**What it is NOT:** A melee weapon with a flag attached. The banner is not swung. The commander **plants, holds, and projects authority**.

---

### Future Instruments (designed, deferred)

Each must pass the same decision-loop test before shipping.

| Instrument | Decision every 10–20s | Active interaction (not damage) |
|---|---|---|
| **Greatsword** | "Do I step forward to legitimize this push?" | **Challenge** — draw enemy attention to commander, validating companion's aggressive orders |
| **Sword & Shield** | "Do I anchor here or shift the line?" | **Brace** — create a brief shield-facing that redirects enemy pathing |
| **Staff** | "Do I channel support now or reposition?" | **Channel** — link to companion, amplifying their next order execution |

---

### Instrument × Doctrine Synergy (intentional, not mandatory)

| Pairing | Expression |
|---|---|
| Shock Assault + Longbow | Designate priority targets from safety; companion executes focus fire on your reads |
| Shock Assault + Battle Banner | Push influence zone forward with aggressive army; morale fuels the charge |
| Iron Wall + Battle Banner | Anchor a fortified zone; army holds ground inside influence ring |
| Iron Wall + Longbow | Designate threats approaching the line; defensive focus fire without leaving position |

**Mismatch is valid.** Shock Assault + Battle Banner requires pushing your influence zone into danger — high skill, high risk.

### Instrument vs. Other Layers

| Layer | Answers | Example |
|---|---|---|
| **Commander** | Who leads the army? | Elite Bond, Swarm Master |
| **Doctrine** | What philosophy of war? | Shock Assault, Iron Wall |
| **Command Instrument** | How do you read and shape the battlefield? | Longbow, Battle Banner |
| **Evolution** | What is the army becoming? | Alpha Wolf, Pack Wolves |
| **Army Equipment** | What gear do units carry? | (Future) Banner of Haste on units |

**Interaction rule:** Doctrine shapes *what orders mean*. Instrument shapes *what the commander actively does*. Evolution shapes *who executes*. No layer replaces another.

### When Instruments Are Chosen

| Timing | What | Why |
|---|---|---|
| **Run Start** | Command Instrument (1 of 2 at debut) | Defines command style alongside doctrine |
| **Mid-Run** | No instrument swap | Commitment pillar |
| **Between Runs** | Unlock new instruments | Options, not power |

### Commander Combat Policy

The commander's direct combat output is always negligible. Instruments provide **utility interactions** — never a primary attack loop.

| Instrument | Direct Combat | Primary Activity |
|---|---|---|
| Longbow | Signal Arrow (ping only) | Designate, Scout Report, direct focus |
| Battle Banner | None | Plant zone, Rally Cry, anchor ground |
| Greatsword (future) | Weak melee + taunt | Challenge, frontline legitimization |
| Sword & Shield (future) | Weak melee + brace | Anchor, redirect |
| Staff (future) | Weak channel | Companion link, support |

**If the player's fingers are mostly on movement keys, the instrument is working.** If the player's fingers are on an attack key, it is not.

### Instrument Input Mapping *(M4.5)*

Keep inputs **simple and remappable**. Controller and mobile layouts derive from the same binding table.

| Slot | Default Key | Behavior |
|---|---|---|
| **Ability 1** | `Q` | Instrument-specific (e.g. Rally Cry, Scout Report) |
| **Ability 2** | `E` | Instrument-specific (e.g. Hold the Line) |
| **Instrument Action** | `F` | Battle Banner: Plant Banner; unused for Longbow at debut |

- `Q` / `E` **remap per instrument** — War Cry and Tactical Rally are replaced, not added alongside
- Tier 1 orders remain `1`–`5` + RMB regardless of instrument
- All bindings stored in a single remappable config for future controller/mobile support

---

## Bond & Cohesion

The bond between commander and companion is a **cohesion system** governed by **Bond Range** — separate from Command Range, Designation Range, and future Presence.

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

---

## Commander Range Systems

Range and influence are **separate systems**. They must remain independently tunable so no single upgrade (e.g. Longbow designation) bypasses the others. Architecture should support a fourth system — **Presence** — in the future without refactoring.

```
┌─────────────────────────────────────────────────────────────┐
│  RANGE & INFLUENCE (independent, stackable, never merged)   │
├─────────────────┬───────────────────────────────────────────┤
│  Bond Range     │  Commander ↔ Companion synchronization    │
│  (M2)           │  Cohesion, obedience, synergy bonuses     │
├─────────────────┼───────────────────────────────────────────┤
│  Command Range  │  How far battlefield orders propagate     │
│  (M4.5)         │  Full effectiveness within range        │
├─────────────────┼───────────────────────────────────────────┤
│  Designation    │  How far Longbow marks priority targets   │
│  Range (M4.5)   │  Independent of Bond and Command          │
├─────────────────┼───────────────────────────────────────────┤
│  Presence       │  Commander proximity influence on army    │
│  (FUTURE)       │  Morale, discipline, response time      │
└─────────────────┴───────────────────────────────────────────┘
```

### Bond Range *(implemented M2)*

**What it governs:** Synchronization between Commander and Companion only.

| In Range | Out of Range |
|---|---|
| Instant obedience | Obedience delay |
| Synergy bonuses (+dmg, +DR) | Desynced behavior (defensive drift) |
| Resync animation on re-entry | "I've lost my partner" |

**Does NOT govern:** How far orders travel. How far Longbow marks targets. Army-wide morale.

**Current value:** 120 units (placeholder tuning).

### Command Range *(M4.5)*

**What it governs:** How far Tier 1 battlefield orders (Hold, Attack, Defend, Rally, Focus) propagate with **full effectiveness**.

| Within Command Range | Beyond Command Range |
|---|---|
| Orders execute normally | Orders weakened, delayed, or ignored (tune per order) |
| Commander leadership reaches the army | Army fights on its own initiative |

**Default (no instrument):** Command Range **equals Bond Range** — keeps early game easy to understand. Commander must stay near companion for orders to carry full weight.

**Longbow modifier:** Extends Command Range significantly. Commander can issue orders from rear echelon — but Bond Range is unchanged. Long-range command is an advantage; it does not replace the need to maintain companion synchronization.

**Key rule:** Extending Command Range never extends Bond Range.

### Designation Range *(M4.5, Longbow only)*

**What it governs:** How far the Longbow can **mark priority targets** (Designate / Focus Target).

- Separate from Bond Range and Command Range
- Allows target marking at distance without implying cohesion or full order authority at that distance
- Designating a far target still requires Command Range to reach companion for Focus to execute — or companion must already be in range of the target

**Decision tension:** "I can *see* and *mark* that threat, but can my army *act* on it without me repositioning?"

### Presence *(FUTURE — do not implement until post-M4.5)*

**What it will govern:** The influence a Commander has by being **physically near their army** — distinct from Bond (companion sync), Command (order propagation), and Designation (target marking).

High Presence may eventually improve:
- Morale
- Formation discipline
- Order response time
- Cohesion
- Confidence

**Why document now:** Code architecture for range checks, ability systems, and instrument modifiers must use **separate values and systems** — not one merged "commander radius." Presence slots in later without refactoring.

**Battle Banner influence zone** is instrument-specific area control, not Presence. Presence is a universal commander stat; banner zone is an instrument mechanic. They may interact in the future but are not the same system.

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
1. Commander           → Who leads
2. Doctrine            → How they fight
3. Command Instrument  → How leadership reaches the army
4. Objective           → What victory means
5. Enemy Faction       → Who opposes you (assigned or chosen, post-M6)
```

This defines the run identity before a single shot is fired.

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
                                        │
┌─────────────┐    propagates    ┌──────▼───────┐
│ INSTRUMENT  │ ───────────────→ │   ARMY       │
│ (medium)    │                  │ (evolutions) │
└─────────────┘                  └──────┬───────┘
                                        │
┌─────────────┐     pressures    ┌──────▼───────┐
│  OBJECTIVE  │ ←─────────────── │    ORDERS     │
│  (why)      │ ───────────────→ │  & ABILITIES  │
└──────┬──────┘   rewards style  └──────┬───────┘
       │                                │
       │ triggers                       │ targeted by
       ▼                                ▼
┌─────────────┐     responds     ┌──────────────┐
│  BATTLEFIELD│ ←─────────────── │    ENEMY     │
│  EVENTS     │                  │  COMMANDER   │
└─────────────┘                  └──────────────┘
```

**Example run:**
> Commander: Elite Bond → Doctrine: Shock Assault → Instrument: Longbow → Objective: Assassination → Enemy: Tactician
>
> You designate targets from behind your companion, issue focus fire without entering melee, and use extended rally range to reposition before the Tactician's Feint. Your instrument kept you alive; your doctrine told you what to prioritize.

---

---

## Enemy Design Philosophy

Every enemy exists to force a **different command decision** from the player.

**Core rule:** If removing an enemy does not change the player's decision-making, that enemy should not exist.

Each enemy has a clear battlefield role, a unique behavior pattern, and a specific tactical question it asks the player.

Difficulty comes from intelligent battlefield pressure — not simply increasing health or damage.

The battlefield should feel like **two armies adapting to one another**, not a collection of enemies independently attacking the player.

| Role | Tactical question | Behavior summary |
|---|---|---|
| **Scout** | Pull companion back to protect yourself, or keep pressuring? | Fast, evasive flanker; ignores frontline; retreats if isolated |
| **Archer** | Close distance, reposition, or designate Archer as priority? | Keeps range; repositions behind allies; targets clustered units |
| **Bruiser** | Focus fire the Bruiser, or ignore it and risk losing formation? | Slow, heavy, knockback; guards ranged allies |
| **Support** | Eliminate Support immediately, even if it exposes the Commander? | Buffs + heals allies behind frontline; avoids direct combat |
| **Assassin** | Intercept with companion, reposition, or sacrifice offensive pressure? | Waits for openings; dashes at Commander; escapes after striking |
| **Siege** | Defend command position, relocate, or eliminate the Siege Unit? | Slow long-range shells on rally/hold positions (Battle Banner placeholder) |
| **Boss (Field Captain)** | Full command test | Phased encounter; summons adds; exposes command weaknesses |

### AI Coordination Rules

- Archers remain behind bruisers
- Scouts attempt flanks; retreat when isolated
- Support retreats behind allies and heals wounded frontliners
- Bruisers position between threats and ranged allies
- Assassins circle until Commander is exposed
- Siege units target battlefield control points (rally/hold markers)

### Prototype Boss: Field Captain

Not a final boss — a **command system stress test**. Requires positioning, Focus Target, abilities, doctrine choice, and companion management.

| Phase | Behavior | Decision forced |
|---|---|---|
| **1 (100–70% HP)** | Frontline bruiser; summons assassins | Focus fire vs. survive pressure |
| **2 (70–40% HP)** | Retreats behind line; summons scouts | Priority targeting support/archers |
| **3 (<40% HP)** | Charges Commander periodically | Defend, reposition, bond management |

**Win condition:** Defeat Field Captain (decisive) or survive 90s (contained).

### Explicitly NOT in M3

- Enemy factions, adaptive AI, enemy commanders, pressure-axis adaptation, battlefield events
- Battle Banners (Siege targets rally/hold positions until M5.5 instruments ship)

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

### M3: Enemy Behavior & Prototype Encounter ✅
- **Six enemy roles:** Scout, Archer, Bruiser, Support, Assassin, Siege — each forces a distinct command decision
- **Grunt removed** — overlapped with Bruiser/Scout without a unique tactical question
- **Coordinated squads:** frontline, ranged, flank, support, siege positioning
- **Field Captain** prototype boss with phased behaviors
- **Command Trial** encounter (phased squads, boss at ~40s)
- Focus Target redirects marked enemies to Companion; archers punish clustering; siege shells rally/hold positions

**Playtest goals:**
- Do enemies create meaningful decisions?
- Does Focus Target matter?
- Do doctrines solve different problems?
- Does Companion positioning matter?
- Does protecting the Commander matter?
- Does the battlefield feel alive?

### M4: Battlefield Event + Annihilation Objective
- **1 dynamic event:** Artillery Barrage (telegraphed zones, reposition or endure)
- **Annihilation objective** selectable in Standard Mode
- Event warning UI (countdown + map indicator)

**Playtest question:** Do events force meaningful repositioning decisions?

### M5: Evolution System + Amendment
- Branching evolution UI (2–3 choices per tier)
- Evolutions change behavior, not just stats
- **Doctrine Amendment** at 60s mark
- First evolution tier at 30s

**Playtest question:** Do evolutions + doctrine amendment feel like deepening a commitment?

### M5.5: Command Instruments
- **Instrument selection** at run start (2 instruments: Longbow, Battle Banner)
- **Range systems:** Bond, Command Range, Designation Range implemented as separate checks
- **Longbow:** Designate, **Scout Report** (ability bar), Signal Arrow
- **Battle Banner:** Plant Banner, Rally Cry, Hold the Line; 0.5s inactive relocation
- Architecture leaves hooks for future **Presence** system (no implementation)
- Setup screen expanded with instrument choice + decision-loop tooltips

**Playtest question:** Does Scout Report make you make better decisions? Does banner relocation feel like a tradeoff, not a punishment? Does long-range command still leave bond tension intact?

### M6: Swarm Master + Domination
- Second commander selectable at run start
- Multiple weak units, reproduction over time
- **Domination objective** (1–2 capture points)
- Second battlefield event: Supply Depot (risk/reward capture)

**Playtest question:** Does swarm + domination feel like a different command style than elite bond + survival?

### M7: Enemy Commanders + Pressure Axes
- Enemy composition reacts to army signals (unit count, range ratio)
- Enemy commander "scout report" UI
- Warlord + Hive Queen factions with signature events
- Tactician Feint event

**Playtest question:** Does enemy adaptation feel fair and readable?

### M8: Escort + Extraction Objectives
- Escort VIP across map
- Extraction with risk/reward timer
- Civilian Evacuation event
- Mercenary Offer event

### M9: Between-Run Meta
- Unlock commanders, doctrines, instruments, evolutions, maps
- Save system (localStorage)
- Unlock options, not power

### M10+: Remaining content
- Conductor formations, Beastmaster creatures
- Corruptor, Beast Lord factions
- Assassination objective
- Army equipment system, full event pool
- Wolfpack + Sacred Bond doctrines
- Greatsword, Sword & Shield, Staff instruments
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
| **Command instruments** | Active battlefield decisions every 10–20s; not DPS or animation swaps | Leadership interactions, not weapons |
| **Instrument debut scope** | 2 instruments (Longbow, Battle Banner) after M4 | Polished decision loops over shallow variety |
| **Battle Banner combat** | Commander cannot attack; influence zone is the instrument | Presence-based leadership, not flag melee |
| **Scout Report input** | Ability bar, cooldown-only (not held Tab) | Unified interface; cheap scouting early |
| **Scout Report cost** | Cooldown-only at debut; add 1 CP later if spammy | Intelligence should feel accessible |
| **Scout Report output** | Actionable battlefield intelligence, not map reveal | Supports assess → decide loop |
| **Default Command Range** | Equals Bond Range until instruments modify | Early game clarity |
| **Instrument inputs** | Q/E per instrument; F for banner plant; remappable | Simple now, flexible later |
| **Banner relocation** | 0.5s setup; zone inactive; commander fully responsive | Tactical tradeoff, not punishment |
| **Range systems** | Bond, Command, and Designation are separate | Long command never bypasses bond tension |
| **Presence system** | Documented for future; architecture stays modular | Fourth influence layer without refactor |

## Open Design Questions

Questions to resolve before implementing Command Instruments (M4.5):

1. **Scout Report cooldown duration** — 15s, 20s, or 25s? Tune during M4.5 playtesting for spam vs. neglect.
2. **Presence implementation milestone** — Defer to M7+; validate range architecture during M4.5 instrument implementation.

Questions to resolve during M2–M3 playtesting:

1. **CP pool size** — 3 CP max feels tense; 4 CP feels comfortable. Playtest both with Shock Assault's War Cry (2 CP).
2. **Desync obedience delay** — 1.5s may be too punishing for fast fights; 2s may be too forgiving. Tune per enemy wave speed.
3. **Resync feel** — Should reuniting have a brief vulnerability window (commitment to regrouping) or be purely rewarding?
4. **Order input scheme** — Hotkeys (1–5) vs. radial menu vs. click-to-order on map. Recommend hotkeys for M2, radial for mobile later.
