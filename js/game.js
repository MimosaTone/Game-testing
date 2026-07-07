// Minion Survivor — Brotato-inspired 5-minute survival game

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const GAME_DURATION = 300; // 5 minutes in seconds
const CANVAS_W = 960;
const CANVAS_H = 640;

canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// --- State ---
let gameState = 'menu'; // menu | playing | upgrade | ended
let lastTime = 0;
let elapsed = 0;
let kills = 0;
let particles = [];
let projectiles = [];
let enemies = [];
let xpOrbs = [];
let damageNumbers = [];

const keys = {};

const player = {
  x: CANVAS_W / 2,
  y: CANVAS_H / 2,
  radius: 22,
  hp: 100,
  maxHp: 100,
  speed: 180,
  damage: 12,
  attackSpeed: 1.2,
  attackRange: 220,
  projectileSpeed: 420,
  multishot: 1,
  pickupRange: 60,
  armor: 0,
  level: 1,
  xp: 0,
  xpToLevel: 30,
  attackCooldown: 0,
  invincible: 0,
  facing: 0,
};

// --- Upgrades ---
const UPGRADES = [
  { id: 'damage', name: 'Sharp Claws', icon: '🗡️', desc: '+25% damage', apply: () => { player.damage *= 1.25; } },
  { id: 'speed', name: 'Swift Feet', icon: '👟', desc: '+15% move speed', apply: () => { player.speed *= 1.15; } },
  { id: 'atkspd', name: 'Rapid Fire', icon: '🔥', desc: '+20% attack speed', apply: () => { player.attackSpeed *= 1.2; } },
  { id: 'hp', name: 'Thick Skin', icon: '❤️', desc: '+30 max HP & heal 30', apply: () => { player.maxHp += 30; player.hp = Math.min(player.hp + 30, player.maxHp); } },
  { id: 'range', name: 'Long Reach', icon: '🎯', desc: '+20% attack range', apply: () => { player.attackRange *= 1.2; } },
  { id: 'multishot', name: 'Split Shot', icon: '✨', desc: '+1 projectile', apply: () => { player.multishot += 1; } },
  { id: 'pickup', name: 'Magnet', icon: '🧲', desc: '+40% pickup range', apply: () => { player.pickupRange *= 1.4; } },
  { id: 'armor', name: 'Iron Shell', icon: '🛡️', desc: '+3 armor (reduces damage)', apply: () => { player.armor += 3; } },
  { id: 'lifesteal', name: 'Vampiric', icon: '🩸', desc: 'Heal 2 HP per kill', apply: () => { player.lifesteal = (player.lifesteal || 0) + 2; } },
  { id: 'crit', name: 'Lucky Strike', icon: '💥', desc: '+15% crit chance (2x dmg)', apply: () => { player.critChance = (player.critChance || 0) + 0.15; } },
];

// --- Enemy types ---
const ENEMY_TYPES = {
  grunt: { color: '#e74c3c', radius: 14, hp: 20, speed: 70, damage: 8, xp: 5, score: 1 },
  speedy: { color: '#e67e22', radius: 10, hp: 12, speed: 130, damage: 6, xp: 7, score: 1 },
  tank: { color: '#8e44ad', radius: 22, hp: 60, speed: 45, damage: 15, xp: 15, score: 3 },
  swarm: { color: '#27ae60', radius: 7, hp: 6, speed: 100, damage: 4, xp: 2, score: 1 },
  elite: { color: '#c0392b', radius: 18, hp: 100, speed: 55, damage: 20, xp: 30, score: 5 },
};

let spawnTimer = 0;
let spawnInterval = 1.8;

// --- Input ---
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

function startGame() {
  resetGame();
  gameState = 'playing';
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('end-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  elapsed = 0;
  kills = 0;
  particles = [];
  projectiles = [];
  enemies = [];
  xpOrbs = [];
  damageNumbers = [];
  spawnTimer = 0;
  spawnInterval = 1.8;

  Object.assign(player, {
    x: CANVAS_W / 2,
    y: CANVAS_H / 2,
    hp: 100,
    maxHp: 100,
    speed: 180,
    damage: 12,
    attackSpeed: 1.2,
    attackRange: 220,
    projectileSpeed: 420,
    multishot: 1,
    pickupRange: 60,
    armor: 0,
    level: 1,
    xp: 0,
    xpToLevel: 30,
    attackCooldown: 0,
    invincible: 0,
    lifesteal: 0,
    critChance: 0,
  });
}

// --- Spawning ---
function getDifficulty() {
  return Math.min(elapsed / GAME_DURATION, 1);
}

function getWave() {
  return Math.floor(elapsed / 30) + 1;
}

function spawnEnemy() {
  const diff = getDifficulty();
  const wave = getWave();

  // Pick enemy type based on difficulty
  let type;
  const roll = Math.random();
  if (diff > 0.7 && roll < 0.08) type = 'elite';
  else if (diff > 0.4 && roll < 0.15) type = 'tank';
  else if (diff > 0.2 && roll < 0.25) type = 'speedy';
  else if (diff > 0.1 && roll < 0.35) type = 'swarm';
  else type = 'grunt';

  const template = ENEMY_TYPES[type];
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 40;
  switch (side) {
    case 0: x = Math.random() * CANVAS_W; y = -margin; break;
    case 1: x = CANVAS_W + margin; y = Math.random() * CANVAS_H; break;
    case 2: x = Math.random() * CANVAS_W; y = CANVAS_H + margin; break;
    default: x = -margin; y = Math.random() * CANVAS_H;
  }

  const hpScale = 1 + diff * 2 + wave * 0.1;
  const dmgScale = 1 + diff * 0.8;

  enemies.push({
    x, y,
    type,
    ...template,
    maxHp: Math.floor(template.hp * hpScale),
    hp: Math.floor(template.hp * hpScale),
    damage: Math.floor(template.damage * dmgScale),
    speed: template.speed * (1 + diff * 0.3),
    hitFlash: 0,
    id: Math.random(),
  });

  // Swarm spawns in groups
  if (type === 'swarm' && Math.random() < 0.6) {
    for (let i = 0; i < 2 + Math.floor(diff * 4); i++) {
      enemies.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        type: 'swarm',
        ...ENEMY_TYPES.swarm,
        maxHp: Math.floor(ENEMY_TYPES.swarm.hp * hpScale),
        hp: Math.floor(ENEMY_TYPES.swarm.hp * hpScale),
        damage: Math.floor(ENEMY_TYPES.swarm.damage * dmgScale),
        speed: ENEMY_TYPES.swarm.speed * (1 + diff * 0.3),
        hitFlash: 0,
        id: Math.random(),
      });
    }
  }
}

// --- Combat ---
function findNearestEnemy() {
  let nearest = null;
  let minDist = player.attackRange;
  for (const e of enemies) {
    const d = dist(player.x, player.y, e.x, e.y);
    if (d < minDist) {
      minDist = d;
      nearest = e;
    }
  }
  return nearest;
}

function fireProjectile(target) {
  const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
  const count = player.multishot;
  const spread = count > 1 ? 0.25 : 0;

  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : spread * (i / (count - 1) - 0.5) * 2;
    const angle = baseAngle + offset;
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * player.projectileSpeed,
      vy: Math.sin(angle) * player.projectileSpeed,
      damage: player.damage,
      radius: 6,
      life: 1.5,
      color: '#f0c040',
    });
  }
  player.facing = baseAngle;
  spawnParticles(player.x, player.y, 3, '#f0c040', 80);
}

function damageEnemy(enemy, dmg) {
  const isCrit = Math.random() < (player.critChance || 0);
  const finalDmg = isCrit ? dmg * 2 : dmg;
  enemy.hp -= finalDmg;
  enemy.hitFlash = 0.15;
  damageNumbers.push({
    x: enemy.x + (Math.random() - 0.5) * 20,
    y: enemy.y - 10,
    text: Math.floor(finalDmg).toString() + (isCrit ? '!' : ''),
    life: 0.8,
    color: isCrit ? '#f0c040' : '#fff',
  });
  spawnParticles(enemy.x, enemy.y, 4, enemy.color, 120);

  if (enemy.hp <= 0) {
    killEnemy(enemy);
  }
}

function killEnemy(enemy) {
  const idx = enemies.indexOf(enemy);
  if (idx === -1) return;
  enemies.splice(idx, 1);
  kills += enemy.score || 1;

  xpOrbs.push({
    x: enemy.x,
    y: enemy.y,
    value: enemy.xp,
    radius: 6,
    magnetized: false,
  });

  if (player.lifesteal) {
    player.hp = Math.min(player.hp + player.lifesteal, player.maxHp);
  }

  spawnParticles(enemy.x, enemy.y, 8, enemy.color, 150);
}

function damagePlayer(amount) {
  if (player.invincible > 0) return;
  const reduced = Math.max(1, amount - player.armor);
  player.hp -= reduced;
  player.invincible = 0.5;
  spawnParticles(player.x, player.y, 6, '#e74c3c', 100);
  if (player.hp <= 0) {
    player.hp = 0;
    endGame(false);
  }
}

// --- XP & Leveling ---
function collectXp(orb) {
  player.xp += orb.value;
  if (player.xp >= player.xpToLevel) {
    player.xp -= player.xpToLevel;
    player.level++;
    player.xpToLevel = Math.floor(30 + player.level * 15);
    showUpgradeScreen();
  }
}

function showUpgradeScreen() {
  gameState = 'upgrade';
  const screen = document.getElementById('upgrade-screen');
  const cards = document.getElementById('upgrade-cards');
  cards.innerHTML = '';

  const pool = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
  pool.forEach((upgrade) => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `
      <div class="icon">${upgrade.icon}</div>
      <div class="name">${upgrade.name}</div>
      <div class="desc">${upgrade.desc}</div>
    `;
    card.addEventListener('click', () => {
      upgrade.apply();
      screen.classList.add('hidden');
      gameState = 'playing';
      lastTime = performance.now();
    });
    cards.appendChild(card);
  });

  screen.classList.remove('hidden');
}

// --- End game ---
function endGame(victory) {
  gameState = 'ended';
  const screen = document.getElementById('end-screen');
  const title = document.getElementById('end-title');
  const stats = document.getElementById('end-stats');

  title.textContent = victory ? 'VICTORY!' : 'DEFEATED';
  title.className = victory ? 'victory' : 'defeat';

  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  stats.innerHTML = `
    <div class="stat-big">${victory ? '5:00 SURVIVED!' : `${mins}:${secs.toString().padStart(2, '0')} survived`}</div>
    <div>Kills: <strong>${kills}</strong></div>
    <div>Level reached: <strong>${player.level}</strong></div>
    <div>Damage: <strong>${Math.floor(player.damage)}</strong></div>
    <div>Attack speed: <strong>${player.attackSpeed.toFixed(1)}/s</strong></div>
  `;

  screen.classList.remove('hidden');
}

// --- Particles ---
function spawnParticles(x, y, count, color, speed) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 0.3 + Math.random() * 0.4,
      color,
      radius: 2 + Math.random() * 3,
    });
  }
}

// --- Utils ---
function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// --- Update ---
function update(dt) {
  if (gameState !== 'playing') return;

  elapsed += dt;

  if (elapsed >= GAME_DURATION) {
    endGame(true);
    return;
  }

  // Player movement
  let dx = 0, dy = 0;
  if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    player.x = clamp(player.x + dx * player.speed * dt, player.radius, CANVAS_W - player.radius);
    player.y = clamp(player.y + dy * player.speed * dt, player.radius, CANVAS_H - player.radius);
    player.facing = Math.atan2(dy, dx);
  }

  if (player.invincible > 0) player.invincible -= dt;

  // Auto attack
  player.attackCooldown -= dt;
  if (player.attackCooldown <= 0) {
    const target = findNearestEnemy();
    if (target) {
      fireProjectile(target);
      player.attackCooldown = 1 / player.attackSpeed;
    }
  }

  // Spawn enemies
  const diff = getDifficulty();
  spawnInterval = Math.max(0.3, 1.8 - diff * 1.4);
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    const batch = 1 + Math.floor(diff * 3) + Math.floor(getWave() / 3);
    for (let i = 0; i < batch; i++) spawnEnemy();
    spawnTimer = spawnInterval;
  }

  // Update enemies
  for (const e of enemies) {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;
    if (e.hitFlash > 0) e.hitFlash -= dt;

    if (dist(e.x, e.y, player.x, player.y) < e.radius + player.radius) {
      damagePlayer(e.damage);
      // Knockback enemy
      e.x -= Math.cos(angle) * 30;
      e.y -= Math.sin(angle) * 30;
    }
  }

  // Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0 || p.x < -20 || p.x > CANVAS_W + 20 || p.y < -20 || p.y > CANVAS_H + 20) {
      projectiles.splice(i, 1);
      continue;
    }
    for (const e of enemies) {
      if (dist(p.x, p.y, e.x, e.y) < e.radius + p.radius) {
        damageEnemy(e, p.damage);
        projectiles.splice(i, 1);
        break;
      }
    }
  }

  // Update XP orbs
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const orb = xpOrbs[i];
    const d = dist(orb.x, orb.y, player.x, player.y);
    if (d < player.pickupRange) orb.magnetized = true;
    if (orb.magnetized) {
      const angle = Math.atan2(player.y - orb.y, player.x - orb.x);
      const speed = Math.min(400, 200 + (player.pickupRange - d) * 5);
      orb.x += Math.cos(angle) * speed * dt;
      orb.y += Math.sin(angle) * speed * dt;
    }
    if (d < player.radius + orb.radius) {
      collectXp(orb);
      xpOrbs.splice(i, 1);
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Update damage numbers
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const d = damageNumbers[i];
    d.y -= 40 * dt;
    d.life -= dt;
    if (d.life <= 0) damageNumbers.splice(i, 1);
  }

  updateHUD();
}

function updateHUD() {
  const remaining = Math.max(0, GAME_DURATION - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  document.getElementById('timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  document.getElementById('wave').textContent = getWave();
  document.getElementById('kills').textContent = kills;
  document.getElementById('hp-bar').style.width = `${(player.hp / player.maxHp) * 100}%`;
  document.getElementById('hp-text').textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  document.getElementById('xp-bar').style.width = `${(player.xp / player.xpToLevel) * 100}%`;
  document.getElementById('level-text').textContent = `LV ${player.level}`;
}

// --- Render ---
function drawMinion(x, y, radius, facing, flash) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  // Body
  const bodyColor = flash ? '#fff' : '#f0c040';
  const shadowColor = '#b8860b';
  ctx.beginPath();
  ctx.ellipse(0, 2, radius, radius * 0.95, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadowColor;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.95, 0, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(-radius * 0.2, -radius * 0.2, 0, 0, 0, radius);
  grad.addColorStop(0, '#ffe566');
  grad.addColorStop(1, bodyColor);
  ctx.fillStyle = grad;
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(radius * 0.25, -radius * 0.15, radius * 0.22, radius * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(radius * 0.25, radius * 0.15, radius * 0.22, radius * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(radius * 0.3, -radius * 0.15, radius * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(radius * 0.3, radius * 0.15, radius * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Little arms
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(radius * 0.7, -radius * 0.5, radius * 0.2, radius * 0.12, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(radius * 0.7, radius * 0.5, radius * 0.2, radius * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEnemy(e) {
  const flash = e.hitFlash > 0;
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
  ctx.fillStyle = flash ? '#fff' : e.color;
  ctx.fill();

  // Angry eyes
  ctx.fillStyle = '#fff';
  const eyeOff = e.radius * 0.3;
  ctx.beginPath();
  ctx.arc(e.x - eyeOff, e.y - eyeOff * 0.5, e.radius * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e.x + eyeOff, e.y - eyeOff * 0.5, e.radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(e.x - eyeOff + 1, e.y - eyeOff * 0.5 + 1, e.radius * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e.x + eyeOff + 1, e.y - eyeOff * 0.5 + 1, e.radius * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // HP bar for tanks/elites
  if (e.maxHp > 30) {
    const barW = e.radius * 2;
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(e.x - barW / 2, e.y - e.radius - 8, barW, 4);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(e.x - barW / 2, e.y - e.radius - 8, barW * hpPct, 4);
  }
}

function drawArena() {
  // Grid floor
  ctx.fillStyle = '#1a1428';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = 'rgba(90, 74, 128, 0.15)';
  ctx.lineWidth = 1;
  const gridSize = 48;
  for (let x = 0; x < CANVAS_W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }

  // Arena border glow
  const remaining = GAME_DURATION - elapsed;
  const urgency = remaining < 30 ? (30 - remaining) / 30 : 0;
  if (urgency > 0) {
    ctx.strokeStyle = `rgba(231, 76, 60, ${urgency * 0.4})`;
    ctx.lineWidth = 4 + urgency * 4;
    ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);
  }
}

function render() {
  drawArena();

  // XP orbs
  for (const orb of xpOrbs) {
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
    grad.addColorStop(0, '#5dade2');
    grad.addColorStop(1, '#2471a3');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Enemies
  for (const e of enemies) drawEnemy(e);

  // Projectiles
  for (const p of projectiles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Player
  if (gameState === 'playing' || gameState === 'upgrade') {
    const flash = player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0;
    drawMinion(player.x, player.y, player.radius, player.facing, flash);
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * (p.life / 0.5), 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Damage numbers
  for (const d of damageNumbers) {
    ctx.globalAlpha = d.life / 0.8;
    ctx.fillStyle = d.color;
    ctx.font = 'bold 14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d.text, d.x, d.y);
    ctx.globalAlpha = 1;
  }
}

// --- Game loop ---
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  if (gameState === 'playing') {
    update(dt);
  }

  render();

  if (gameState !== 'ended' && gameState !== 'menu') {
    requestAnimationFrame(gameLoop);
  }
}

// Initial render
drawArena();
drawMinion(CANVAS_W / 2, CANVAS_H / 2, 22, 0, false);
