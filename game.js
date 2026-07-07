// Minion Mayhem — Brotato-inspired 5-minute survival game

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const GAME_DURATION = 300; // 5 minutes in seconds
const ARENA_PADDING = 40;

// DOM elements
const hud = document.getElementById('hud');
const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('start-screen');
const levelupScreen = document.getElementById('levelup-screen');
const endScreen = document.getElementById('end-screen');
const upgradeChoices = document.getElementById('upgrade-choices');
const timerDisplay = document.getElementById('timer-display');
const waveDisplay = document.getElementById('wave-display');
const killsDisplay = document.getElementById('kills-display');
const scoreDisplay = document.getElementById('score-display');
const healthBar = document.getElementById('health-bar');
const xpBar = document.getElementById('xp-bar');
const levelDisplay = document.getElementById('level-display');
const endTitle = document.getElementById('end-title');
const endMessage = document.getElementById('end-message');
const endStats = document.getElementById('end-stats');

// Game state
let gameState = 'menu'; // menu, playing, levelup, ended
let lastTime = 0;
let keys = {};
let mouse = { x: W / 2, y: H / 2 };

let player, enemies, projectiles, xpOrbs, particles;
let timeRemaining, wave, kills, score, spawnTimer, waveTimer;
let paused = false;

// Upgrade definitions
const UPGRADES = [
  { id: 'damage', name: 'Spicy Banana', desc: '+20% damage', apply: (p) => { p.damage *= 1.2; } },
  { id: 'atkspd', name: 'Caffeine Rush', desc: '+15% attack speed', apply: (p) => { p.attackSpeed *= 1.15; } },
  { id: 'movespd', name: 'Rocket Boots', desc: '+12% move speed', apply: (p) => { p.speed *= 1.12; } },
  { id: 'maxhp', name: 'Extra Goggles', desc: '+25 max HP', apply: (p) => { p.maxHp += 25; p.hp += 25; } },
  { id: 'multishot', name: 'Banana Split', desc: '+1 projectile', apply: (p) => { p.projectileCount += 1; } },
  { id: 'pierce', name: 'Sharp Peel', desc: '+1 pierce', apply: (p) => { p.pierce += 1; } },
  { id: 'magnet', name: 'XP Magnet', desc: '+40% pickup range', apply: (p) => { p.magnetRange *= 1.4; } },
  { id: 'regen', name: 'Banana Smoothie', desc: '+1 HP/sec regen', apply: (p) => { p.regen += 1; } },
  { id: 'aoe', name: 'Banana Boom', desc: 'Splash damage on hit', apply: (p) => { p.aoeRadius += 35; } },
  { id: 'crit', name: 'Lucky Banana', desc: '+10% crit chance', apply: (p) => { p.critChance = Math.min(0.5, p.critChance + 0.1); } },
  { id: 'lifesteal', name: 'Vampire Minion', desc: 'Heal 1 HP per kill', apply: (p) => { p.lifesteal += 1; } },
  { id: 'armor', name: 'Denim Overalls', desc: '-15% damage taken', apply: (p) => { p.armor = Math.min(0.6, p.armor + 0.15); } },
];

const ENEMY_TYPES = {
  grunt: { color: '#9b59b6', radius: 14, hp: 20, speed: 70, damage: 8, xp: 3, score: 10 },
  speedy: { color: '#e74c3c', radius: 10, hp: 12, speed: 130, damage: 6, xp: 4, score: 15 },
  tank: { color: '#2c3e50', radius: 22, hp: 60, speed: 45, damage: 15, xp: 8, score: 30 },
  swarm: { color: '#27ae60', radius: 8, hp: 8, speed: 100, damage: 4, xp: 2, score: 5 },
  boss: { color: '#c0392b', radius: 35, hp: 400, speed: 55, damage: 25, xp: 50, score: 200 },
};

function createPlayer() {
  return {
    x: W / 2,
    y: H / 2,
    radius: 18,
    hp: 100,
    maxHp: 100,
    speed: 200,
    damage: 12,
    attackSpeed: 1.8, // attacks per second
    attackTimer: 0,
    projectileCount: 1,
    pierce: 0,
    magnetRange: 80,
    regen: 0,
    aoeRadius: 0,
    critChance: 0.05,
    lifesteal: 0,
    armor: 0,
    level: 1,
    xp: 0,
    xpToLevel: 15,
    invincible: 0,
  };
}

function resetGame() {
  player = createPlayer();
  enemies = [];
  projectiles = [];
  xpOrbs = [];
  particles = [];
  timeRemaining = GAME_DURATION;
  wave = 1;
  kills = 0;
  score = 0;
  spawnTimer = 0;
  waveTimer = 0;
  paused = false;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function spawnEnemy(type = 'grunt', scale = 1) {
  const def = ENEMY_TYPES[type];
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const pad = 30;
  switch (side) {
    case 0: x = rand(pad, W - pad); y = -pad; break;
    case 1: x = W + pad; y = rand(pad, H - pad); break;
    case 2: x = rand(pad, W - pad); y = H + pad; break;
    default: x = -pad; y = rand(pad, H - pad);
  }

  const difficulty = 1 + (GAME_DURATION - timeRemaining) / GAME_DURATION * 2;
  enemies.push({
    x, y,
    type,
    color: def.color,
    radius: def.radius,
    hp: def.hp * scale * difficulty,
    maxHp: def.hp * scale * difficulty,
    speed: def.speed * (1 + difficulty * 0.1),
    damage: def.damage * scale,
    xp: def.xp,
    score: def.score,
    hitFlash: 0,
  });
}

function spawnWave() {
  const difficulty = 1 + (GAME_DURATION - timeRemaining) / GAME_DURATION * 3;
  const count = Math.floor(3 + wave * 1.5 + difficulty * 2);

  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let type = 'grunt';
    if (roll < 0.15 + wave * 0.02) type = 'speedy';
    if (roll < 0.08 + wave * 0.01) type = 'tank';
    if (roll < 0.2 && wave > 2) type = 'swarm';
    spawnEnemy(type, 1 + wave * 0.05);
  }

  // Boss every 5 waves or at 1 min remaining
  if (wave % 5 === 0 || timeRemaining < 60 && wave % 3 === 0) {
    spawnEnemy('boss', 1 + wave * 0.1);
  }

  wave++;
}

function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(50, 150);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.3, 0.7),
      maxLife: 0.7,
      color,
      radius: rand(2, 5),
    });
  }
}

function spawnXpOrb(x, y, amount) {
  xpOrbs.push({ x, y, amount, radius: 6, bob: rand(0, Math.PI * 2) });
}

function findNearestEnemy() {
  let nearest = null;
  let nearestDist = Infinity;
  for (const e of enemies) {
    const d = dist(player, e);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = e;
    }
  }
  return nearest;
}

function shoot() {
  const target = findNearestEnemy();
  if (!target) return;

  const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
  const count = player.projectileCount;
  const spread = count > 1 ? 0.25 : 0;

  for (let i = 0; i < count; i++) {
    const offset = count > 1 ? (i - (count - 1) / 2) * spread / (count - 1) : 0;
    const angle = baseAngle + offset;
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * 400,
      vy: Math.sin(angle) * 400,
      damage: player.damage,
      pierce: player.pierce,
      pierced: [],
      radius: 6,
      life: 2,
    });
  }
}

function killEnemy(enemy) {
  kills++;
  score += enemy.score;
  spawnXpOrb(enemy.x, enemy.y, enemy.xp);
  spawnParticles(enemy.x, enemy.y, enemy.color, 12);
  if (player.lifesteal > 0) {
    player.hp = Math.min(player.maxHp, player.hp + player.lifesteal);
  }
}

function dealAoeDamage(x, y, damage, radius, sourceProj) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (dist({ x, y }, e) < radius + e.radius) {
      const isCrit = Math.random() < player.critChance;
      const dmg = isCrit ? damage * 2 : damage;
      e.hp -= dmg * 0.5;
      e.hitFlash = 0.1;
      if (e.hp <= 0) {
        killEnemy(e);
        enemies.splice(i, 1);
      }
    }
  }
}

function levelUp() {
  paused = true;
  gameState = 'levelup';
  showOverlay();
  levelupScreen.classList.remove('hidden');
  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');

  const options = [];
  const pool = [...UPGRADES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3 && i < pool.length; i++) {
    options.push(pool[i]);
  }

  upgradeChoices.innerHTML = '';
  options.forEach((upgrade) => {
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    btn.innerHTML = `<span class="upgrade-name">${upgrade.name}</span><span class="upgrade-desc">${upgrade.desc}</span>`;
    btn.addEventListener('click', () => {
      upgrade.apply(player);
      player.level++;
      player.xp -= player.xpToLevel;
      player.xpToLevel = Math.floor(player.xpToLevel * 1.25 + 5);
      levelupScreen.classList.add('hidden');
      paused = false;
      gameState = 'playing';
    });
    upgradeChoices.appendChild(btn);
  });
}

function endGame(victory) {
  gameState = 'ended';
  paused = true;
  showOverlay();
  levelupScreen.classList.add('hidden');
  endScreen.classList.remove('hidden');

  if (victory) {
    endTitle.textContent = '🎉 Victory!';
    endTitle.style.color = '#4ecca3';
    endMessage.textContent = 'You survived 5 minutes of minion mayhem!';
    score += 1000;
  } else {
    endTitle.textContent = '💀 Game Over';
    endTitle.style.color = '#e94560';
    endMessage.textContent = 'The minions need a break...';
  }

  const survived = formatTime(GAME_DURATION - timeRemaining);
  endStats.innerHTML = `
    <div>Time survived: <strong>${survived}</strong></div>
    <div>Kills: <strong>${kills}</strong></div>
    <div>Level reached: <strong>${player.level}</strong></div>
    <div>Final score: <strong>${score}</strong></div>
  `;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateHUD() {
  timerDisplay.textContent = formatTime(timeRemaining);
  waveDisplay.textContent = wave;
  killsDisplay.textContent = kills;
  scoreDisplay.textContent = score;
  healthBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
  xpBar.style.width = `${(player.xp / player.xpToLevel) * 100}%`;
  levelDisplay.textContent = `Lv ${player.level}`;
}

// --- Update ---
function update(dt) {
  if (paused || gameState !== 'playing') return;

  timeRemaining -= dt;
  if (timeRemaining <= 0) {
    timeRemaining = 0;
    endGame(true);
    return;
  }

  // Wave spawning
  waveTimer += dt;
  const waveInterval = Math.max(8, 20 - wave * 0.5);
  if (waveTimer >= waveInterval) {
    waveTimer = 0;
    spawnWave();
  }

  // Continuous spawning between waves
  spawnTimer += dt;
  const spawnRate = Math.max(0.3, 1.5 - (GAME_DURATION - timeRemaining) / GAME_DURATION);
  if (spawnTimer >= spawnRate) {
    spawnTimer = 0;
    const roll = Math.random();
    if (roll < 0.6) spawnEnemy('grunt');
    else if (roll < 0.85) spawnEnemy('swarm');
    else spawnEnemy('speedy');
  }

  // Player movement
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    player.x += (dx / len) * player.speed * dt;
    player.y += (dy / len) * player.speed * dt;
  }
  player.x = clamp(player.x, ARENA_PADDING, W - ARENA_PADDING);
  player.y = clamp(player.y, ARENA_PADDING, H - ARENA_PADDING);

  // Regen
  if (player.regen > 0) {
    player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
  }

  // Invincibility
  if (player.invincible > 0) player.invincible -= dt;

  // Auto attack
  player.attackTimer -= dt;
  if (player.attackTimer <= 0) {
    const target = findNearestEnemy();
    if (target && dist(player, target) < 500) {
      shoot();
      player.attackTimer = 1 / player.attackSpeed;
    }
  }

  // Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
      projectiles.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (p.pierced.includes(e)) continue;
      if (dist(p, e) < p.radius + e.radius) {
        const isCrit = Math.random() < player.critChance;
        const dmg = isCrit ? p.damage * 2 : p.damage;
        e.hp -= dmg;
        e.hitFlash = 0.1;
        p.pierced.push(e);

        if (player.aoeRadius > 0) {
          dealAoeDamage(e.x, e.y, p.damage, player.aoeRadius, p);
        }

        spawnParticles(e.x, e.y, isCrit ? '#ffd700' : '#f5e642', 4);

        if (e.hp <= 0) {
          killEnemy(e);
          enemies.splice(j, 1);
        }

        if (p.pierced.length > p.pierce + 1) {
          projectiles.splice(i, 1);
        }
        break;
      }
    }
  }

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;
    if (e.hitFlash > 0) e.hitFlash -= dt;

    if (dist(player, e) < player.radius + e.radius && player.invincible <= 0) {
      const dmg = e.damage * (1 - player.armor);
      player.hp -= dmg;
      player.invincible = 0.5;
      spawnParticles(player.x, player.y, '#e94560', 6);

      if (player.hp <= 0) {
        player.hp = 0;
        endGame(false);
        return;
      }
    }
  }

  // XP orbs
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const orb = xpOrbs[i];
    orb.bob += dt * 4;
    const d = dist(player, orb);
    if (d < player.magnetRange) {
      const pull = 300;
      const angle = Math.atan2(player.y - orb.y, player.x - orb.x);
      orb.x += Math.cos(angle) * pull * dt;
      orb.y += Math.sin(angle) * pull * dt;
    }
    if (d < player.radius + orb.radius) {
      player.xp += orb.amount;
      score += orb.amount * 2;
      xpOrbs.splice(i, 1);
      if (player.xp >= player.xpToLevel) {
        levelUp();
      }
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  updateHUD();
}

// --- Render ---
function drawArena() {
  // Grass background with grid
  ctx.fillStyle = '#2d5a3e';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Arena border
  ctx.strokeStyle = '#f5e642';
  ctx.lineWidth = 3;
  ctx.strokeRect(ARENA_PADDING, ARENA_PADDING, W - ARENA_PADDING * 2, H - ARENA_PADDING * 2);
}

function drawMinion(x, y, radius, facing = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  // Body
  ctx.fillStyle = '#f5e642';
  ctx.beginPath();
  ctx.ellipse(0, 2, radius, radius * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d3d6b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Overalls
  ctx.fillStyle = '#4a6fa5';
  ctx.fillRect(-radius * 0.7, radius * 0.1, radius * 1.4, radius * 0.8);
  ctx.fillStyle = '#3d5a80';
  ctx.fillRect(-radius * 0.15, -radius * 0.3, radius * 0.3, radius * 0.5);

  // Goggles
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.roundRect(-radius * 0.75, -radius * 0.5, radius * 1.5, radius * 0.45, 4);
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.3, -radius * 0.28, radius * 0.22, radius * 0.18, 0, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.3, -radius * 0.28, radius * 0.22, radius * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a3728';
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.25, radius * 0.1, 0, Math.PI * 2);
  ctx.arc(radius * 0.3, -radius * 0.25, radius * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#3d3d6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, radius * 0.15, radius * 0.3, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);

  const flash = e.hitFlash > 0;
  ctx.fillStyle = flash ? '#fff' : e.color;
  ctx.beginPath();

  if (e.type === 'boss') {
    // Evil purple minion boss
    ctx.ellipse(0, 0, e.radius, e.radius * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Evil eyes
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(-10, -8, 6, 0, Math.PI * 2);
    ctx.arc(10, -8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(-10, -8, 3, 0, Math.PI * 2);
    ctx.arc(10, -8, 3, 0, Math.PI * 2);
    ctx.fill();
    // HP bar
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(-e.radius, -e.radius - 12, e.radius * 2, 6);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-e.radius, -e.radius - 12, e.radius * 2 * hpPct, 6);
  } else if (e.type === 'tank') {
    ctx.rect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (e.type === 'speedy') {
    ctx.moveTo(0, -e.radius);
    ctx.lineTo(e.radius, e.radius);
    ctx.lineTo(-e.radius, e.radius);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    // Simple angry face
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -3, 3, 0, Math.PI * 2);
    ctx.arc(4, -3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBanana(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const angle = Math.atan2(p.vy, p.vx);
  ctx.rotate(angle);

  ctx.fillStyle = '#f5e642';
  ctx.strokeStyle = '#c9a800';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(0, -6, 8, 0);
  ctx.quadraticCurveTo(0, 6, -8, 0);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawXpOrb(orb) {
  const bobY = Math.sin(orb.bob) * 3;
  ctx.save();
  ctx.translate(orb.x, orb.y + bobY);
  ctx.fillStyle = '#4a90d9';
  ctx.shadowColor = '#7ec8e3';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(-2, -2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function render() {
  drawArena();

  // XP orbs
  for (const orb of xpOrbs) drawXpOrb(orb);

  // Enemies
  for (const e of enemies) drawEnemy(e);

  // Projectiles
  for (const p of projectiles) drawBanana(p);

  // Player
  if (player) {
    if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    const target = findNearestEnemy();
    const facing = target ? Math.atan2(target.y - player.y, target.x - player.x) : 0;
    drawMinion(player.x, player.y, player.radius, facing);
    ctx.globalAlpha = 1;
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Low time warning
  if (gameState === 'playing' && timeRemaining <= 30) {
    ctx.fillStyle = `rgba(233, 69, 96, ${0.3 + Math.sin(Date.now() / 200) * 0.15})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (gameState === 'playing') {
    update(dt);
  }
  render();

  requestAnimationFrame(gameLoop);
}

// --- Input ---
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * (W / rect.width);
  mouse.y = (e.clientY - rect.top) * (H / rect.height);
});

// --- UI ---
function showOverlay() {
  overlay.style.display = 'flex';
}

function hideOverlay() {
  overlay.style.display = 'none';
}

document.getElementById('start-btn').addEventListener('click', () => {
  resetGame();
  gameState = 'playing';
  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  levelupScreen.classList.add('hidden');
  hideOverlay();
  hud.classList.remove('hidden');
  spawnWave();
  lastTime = performance.now();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  resetGame();
  gameState = 'playing';
  endScreen.classList.add('hidden');
  hideOverlay();
  hud.classList.remove('hidden');
  spawnWave();
  lastTime = performance.now();
});

// Start loop
resetGame();
requestAnimationFrame(gameLoop);
