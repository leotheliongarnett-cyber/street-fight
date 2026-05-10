import { floorHeight, characterTypes, weapons, platformConfigs } from './data.js';
import { Fighter, setOpponentLookup } from './fighter.js';
import * as UI from './ui.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const keys = {};
let groundY = 0;
let gameOver = false;
let cpuEnabled = true;
let cpuDifficulty = 'medium';
let selectedP1 = 'human';
let selectedP2 = 'gorilla';
let selectedWeapon1 = 'sword';
let selectedWeapon2 = 'katana';

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  groundY = canvas.height - floorHeight;
}

window.addEventListener('resize', resize);
resize();

function getPlatforms() {
  return {
    canvasWidth: canvas.width,
    groundY,
    list: platformConfigs.map(cfg => ({
      x: () => canvas.width * cfg.xFactor,
      y: () => groundY + cfg.yOffset,
      width: cfg.width,
      height: cfg.height
    }))
  };
}

function updateUI() {
  UI.updateHealthBars(player1, player2);
  UI.updateCoinDisplays(player1, player2);
}

function handleCharacterSelect(player, characterKey) {
  if (player === 1) {
    selectedP1 = characterKey;
  } else {
    selectedP2 = characterKey;
  }
  UI.updateSelections(selectedP1, selectedP2);
}

function handleWeaponSelect(player, weaponKey) {
  if (player === 1) {
    selectedWeapon1 = weaponKey;
  } else {
    selectedWeapon2 = weaponKey;
  }
  UI.updateWeaponSelections(selectedWeapon1, selectedWeapon2);
}

const player1 = new Fighter({
  x: canvas.width - 180,
  y: groundY - 110,
  color: '#e74c3c',
  controls: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    jump: 'ArrowUp',
    block: 'ArrowDown',
    attack: 'Shift'
  },
  onStateChange: updateUI,
  onDeath: endGame
});

const player2 = new Fighter({
  x: 120,
  y: groundY - 110,
  color: '#2ecc71',
  characterType: 'gorilla',
  isCPU: true,
  controls: {
    left: 'a',
    right: 'd',
    jump: 'w',
    block: 's',
    attack: 't'
  },
  onStateChange: updateUI,
  onDeath: endGame
});

setOpponentLookup(player => (player === player1 ? player2 : player1));

UI.init({
  selectedP1,
  selectedP2,
  selectedWeapon1,
  selectedWeapon2,
  onCharacterSelect: handleCharacterSelect,
  onWeaponSelect: handleWeaponSelect,
  onStart: startGame
});

function configurePlayer(player, characterKey, weaponKey) {
  player.characterType = characterKey;
  player.character = characterTypes[characterKey];
  player.weaponType = weaponKey;
  player.weapon = weapons[weaponKey];
  player.maxHealth = player.character.maxHealth;
  player.health = player.maxHealth;
  player.speed = player.character.speed;
  player.color = player.character.color;
  player.coins = 0;
  player.isBlocking = false;
  player.isAttacking = false;
  player.attackCooldown = 0;
  player.freezeFrames = 0;
  player.invulnerableFrames = 0;
  player.flashTimer = 0;
  player.healCooldown = 0;
  player.cpuJumpTimer = 0;
  player.x = player === player1 ? canvas.width - 180 : 120;
  player.y = groundY - 110;
}

function startGame() {
  gameOver = false;
  cpuEnabled = UI.isCpuEnabled();
  cpuDifficulty = UI.getCpuDifficulty();

  configurePlayer(player1, selectedP1, selectedWeapon1);
  configurePlayer(player2, selectedP2, selectedWeapon2);
  player2.isCPU = cpuEnabled;

  updateUI();
  UI.hideMenu();
}

function endGame(winner) {
  gameOver = true;
  UI.showWinner(winner === player1 ? 'Player 1' : 'Player 2');
}

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (gameOver) return;

  if (e.key === player1.controls.jump) {
    player1.jump();
  }

  if (!player2.isCPU && e.key === player2.controls.jump) {
    player2.jump();
  }

  if (e.key === player1.controls.attack) {
    player1.attack();
  }

  if (!player2.isCPU && e.key === player2.controls.attack) {
    player2.attack();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

function drawPlatforms() {
  const platformData = getPlatforms().list;
  for (const platform of platformData) {
    const px = platform.x();
    const py = platform.y();

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(px + 8, py + 8, platform.width, platform.height);

    ctx.fillStyle = '#6b4f2a';
    ctx.fillRect(px, py, platform.width, platform.height);

    ctx.fillStyle = '#9b7440';
    ctx.fillRect(px, py, platform.width, 5);

    ctx.fillStyle = '#4a341c';
    ctx.fillRect(px + 20, py + platform.height, 10, 50);
    ctx.fillRect(px + platform.width - 30, py + platform.height, 10, 50);
  }
}

function drawBackground() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, groundY, canvas.width, floorHeight);

  ctx.fillStyle = '#555';
  for (let i = 0; i < canvas.width; i += 60) {
    ctx.fillRect(i, groundY + 30, 30, 10);
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPlatforms();

  const platforms = getPlatforms();
  player1.update(gameOver, platforms, keys, cpuDifficulty);
  player2.update(gameOver, platforms, keys, cpuDifficulty);

  player1.draw(ctx, groundY);
  player2.draw(ctx, groundY);

  requestAnimationFrame(gameLoop);
}

gameLoop();
