import { characterTypes, weapons, gravity } from './data.js';

let opponentLookup = null;
export function setOpponentLookup(fn) {
  opponentLookup = fn;
}

export function opponentOf(player) {
  return opponentLookup ? opponentLookup(player) : null;
}

export class Fighter {
  constructor(options) {
    Object.assign(this, options);

    this.characterType = this.characterType || 'human';
    this.character = characterTypes[this.characterType] || characterTypes.human;
    this.color = this.character.color;

    this.width = 60;
    this.height = 110;
    this.velocityX = 0;
    this.velocityY = 0;

    this.speed = this.character.speed || 6;
    this.jumpStrength = 16;

    this.onGround = false;
    this.maxHealth = this.character.maxHealth || 10;
    this.health = this.maxHealth;

    this.isBlocking = false;
    this.isAttacking = false;

    this.attackCooldown = 0;
    this.attackDuration = 10;

    this.freezeFrames = 0;
    this.invulnerableFrames = 0;
    this.flashTimer = 0;

    this.cpuJumpTimer = 0;

    this.weaponType = this.weaponType || 'sword';
    this.weapon = weapons[this.weaponType];
    this.healCooldown = 0;

    this.coins = this.coins || 0;
    this.onStateChange = this.onStateChange || (() => {});
    this.onDeath = this.onDeath || (() => {});
  }

  get facingDirection() {
    const enemy = opponentOf(this);
    return enemy && this.x < enemy.x ? 1 : -1;
  }

  update(gameOver, platforms, inputState, cpuDifficulty) {
    if (this.isCPU && !gameOver) {
      this.handleCPU(inputState, cpuDifficulty);
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.healCooldown > 0) this.healCooldown--;
    if (this.freezeFrames > 0) {
      this.freezeFrames--;
      return;
    }

    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames--;
      this.flashTimer++;
    }

    this.handleMovement(inputState);

    this.x += this.velocityX;
    this.y += this.velocityY;

    this.velocityY += gravity;

    if (this.y + this.height >= platforms.groundY) {
      this.y = platforms.groundY - this.height;
      this.velocityY = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.x = Math.max(0, Math.min(platforms.canvasWidth - this.width, this.x));

    for (const platform of platforms.list) {
      const px = platform.x();
      const py = platform.y();

      const touchingPlatform =
        this.x + this.width > px &&
        this.x < px + platform.width &&
        this.y + this.height >= py &&
        this.y + this.height <= py + 22 &&
        this.velocityY >= 0;

      if (touchingPlatform) {
        this.y = py - this.height;
        this.velocityY = 0;
        this.onGround = true;
      }
    }
  }

  handleMovement(inputState) {
    this.velocityX = 0;

    if (this.isAttacking) return;

    const left = inputState[this.controls.left];
    const right = inputState[this.controls.right];

    if (left) this.velocityX = -this.speed;
    if (right) this.velocityX = this.speed;

    this.isBlocking = !!inputState[this.controls.block];

    if (this.isBlocking) {
      this.velocityX *= 0.3;
    }
  }

  handleCPU(inputState, cpuDifficulty) {
    const settings = {
      easy: {
        attackChance: 0.025,
        blockChance: 0.03,
        reactionDistance: 75,
        jumpChance: 0.008,
        aggression: 0.7
      },
      medium: {
        attackChance: 0.05,
        blockChance: 0.06,
        reactionDistance: 85,
        jumpChance: 0.015,
        aggression: 1
      },
      hard: {
        attackChance: 0.09,
        blockChance: 0.1,
        reactionDistance: 100,
        jumpChance: 0.02,
        aggression: 1.2
      },
      extra: {
        attackChance: 0.15,
        blockChance: 0.16,
        reactionDistance: 115,
        jumpChance: 0.03,
        aggression: 1.35
      }
    };

    const ai = settings[cpuDifficulty];
    this.speed = 6 * ai.aggression;
    const enemy = opponentOf(this);
    const distance = enemy.x - this.x;
    const absDistance = Math.abs(distance);

    inputState[this.controls.left] = false;
    inputState[this.controls.right] = false;
    inputState[this.controls.block] = false;

    if (this.freezeFrames > 0) return;

    if (absDistance > ai.reactionDistance) {
      if (distance > 0) {
        inputState[this.controls.right] = true;
      } else {
        inputState[this.controls.left] = true;
      }
    }

    if (absDistance < 45) {
      if (distance > 0) {
        inputState[this.controls.left] = true;
      } else {
        inputState[this.controls.right] = true;
      }
    }

    if (enemy.isAttacking && Math.random() < ai.blockChance) {
      inputState[this.controls.block] = true;
    }

    this.cpuJumpTimer++;
    if (this.cpuJumpTimer > 90 && Math.random() < ai.jumpChance) {
      this.jump();
      this.cpuJumpTimer = 0;
    }

    if (absDistance < ai.reactionDistance && !this.isBlocking) {
      if (Math.random() < ai.attackChance) {
        this.attack();
      }
    }
  }

  jump() {
    if (this.onGround && !this.isBlocking && !this.isAttacking) {
      this.velocityY = -this.jumpStrength;
    }
  }

  attack() {
    if (this.weapon.heal) {
      if (this.healCooldown <= 0) {
        this.health = Math.min(this.maxHealth, this.health + this.maxHealth / 10);
        this.healCooldown = 60;
        this.onStateChange();
      }
    }

    if (
      this.isAttacking ||
      this.attackCooldown > 0 ||
      this.isBlocking ||
      this.freezeFrames > 0
    ) {
      return;
    }

    this.isAttacking = true;
    this.attackCooldown = 24;

    setTimeout(() => {
      this.checkHit();
    }, 80);

    setTimeout(() => {
      this.isAttacking = false;
    }, this.attackDuration * 16);
  }

  checkHit() {
    const enemy = opponentOf(this);

    const attackRange = this.weapon.range;
    const dx = enemy.x - this.x;
    const facingCorrectly = Math.sign(dx) === this.facingDirection;
    const closeEnough = Math.abs(dx) < attackRange;
    const verticalHit = Math.abs(enemy.y - this.y) < 90;

    if (
      facingCorrectly &&
      closeEnough &&
      verticalHit &&
      enemy.invulnerableFrames <= 0
    ) {
      if (!enemy.isBlocking) {
        enemy.lastDamageTaken = this.weapon.damage;
        enemy.takeHit();

        this.coins += this.weapon.damage;
        this.onStateChange();
      }
    }
  }

  takeHit() {
    this.health = Math.max(0, this.health - this.lastDamageTaken);
    this.freezeFrames = 18;
    this.invulnerableFrames = 30;
    this.flashTimer = 0;

    this.onStateChange();

    if (this.health <= 0) {
      this.onDeath(opponentOf(this));
    }
  }

  draw(ctx, groundY) {
    const flashing =
      this.invulnerableFrames > 0 &&
      Math.floor(this.flashTimer / 3) % 2 === 0;

    if (flashing) return;

    ctx.save();

    const centerX = this.x + this.width / 2;
    const headY = this.y + 16;
    const bodyY = this.y + 42;

    let bodyColor = this.color;
    if (this.isBlocking) {
      bodyColor = '#3498db';
    }
    if (this.isAttacking) {
      bodyColor = '#f1c40f';
    }

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(centerX, groundY + 6, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.characterType === 'human') {
      ctx.fillStyle = '#f1c27d';
      ctx.beginPath();
      ctx.arc(centerX, headY, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(centerX, headY - 4, 16, Math.PI, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(centerX - 5, headY - 2, 2, 0, Math.PI * 2);
      ctx.arc(centerX + 5, headY - 2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bodyColor;
      ctx.fillRect(centerX - 16, bodyY, 32, 42);

      ctx.fillStyle = '#111';
      ctx.fillRect(centerX - 16, bodyY + 32, 32, 6);

      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';

      const attackExtend = this.isAttacking
        ? this.weaponType === 'katana'
          ? 70
          : this.weaponType === 'knife'
          ? 10
          : 26
        : 0;
      const frontArmX = centerX + (this.facingDirection * (24 + attackExtend));
      const backArmX = centerX - (this.facingDirection * 18);

      ctx.beginPath();
      ctx.moveTo(centerX, bodyY + 10);
      ctx.lineTo(backArmX, bodyY + 28);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX, bodyY + 10);
      ctx.lineTo(frontArmX, bodyY + 18);
      ctx.stroke();

      ctx.fillStyle = '#f1c27d';
      ctx.beginPath();
      ctx.arc(frontArmX, bodyY + 18, 5, 0, Math.PI * 2);
      ctx.arc(backArmX, bodyY + 28, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#444';
      ctx.lineWidth = 12;

      const legSpread = Math.abs(this.velocityX) > 0 ? 10 : 4;

      ctx.beginPath();
      ctx.moveTo(centerX - 8, bodyY + 42);
      ctx.lineTo(centerX - legSpread, bodyY + 78);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 8, bodyY + 42);
      ctx.lineTo(centerX + legSpread, bodyY + 78);
      ctx.stroke();
    } else if (this.characterType === 'gorilla') {
      ctx.fillStyle = '#3d3d3d';
      ctx.beginPath();
      ctx.roundRect(centerX - 26, bodyY - 4, 52, 54, 16);
      ctx.fill();

      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(centerX, headY + 6, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.ellipse(centerX, headY + 10, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(centerX - 6, headY + 2, 2, 0, Math.PI * 2);
      ctx.arc(centerX + 6, headY + 2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 14;

      const punch = this.isAttacking ? 30 : 0;

      ctx.beginPath();
      ctx.moveTo(centerX - 18, bodyY + 12);
      ctx.lineTo(centerX - 32 - punch * this.facingDirection, bodyY + 38);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 18, bodyY + 12);
      ctx.lineTo(centerX + 32 + punch * this.facingDirection, bodyY + 38);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX - 14, bodyY + 46);
      ctx.lineTo(centerX - 20, bodyY + 82);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 14, bodyY + 46);
      ctx.lineTo(centerX + 20, bodyY + 82);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.character.headColor;
      ctx.beginPath();
      ctx.ellipse(centerX, headY + 6, 20, 17, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.characterType === 'lion') {
        ctx.strokeStyle = '#5a3b11';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(centerX, headY + 6, 24, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = this.character.hair;
      ctx.beginPath();
      ctx.arc(centerX - 12, headY - 8, 6, 0, Math.PI * 2);
      ctx.arc(centerX + 12, headY - 8, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f5deb3';
      ctx.beginPath();
      ctx.ellipse(centerX, headY + 10, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(centerX - 6, headY + 2, 2, 0, Math.PI * 2);
      ctx.arc(centerX + 6, headY + 2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, headY + 8, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(centerX, bodyY + 28, 28, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.characterType === 'tiger') {
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX + i * 8, bodyY + 8);
          ctx.lineTo(centerX + i * 6, bodyY + 42);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = this.character.hair;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(centerX - this.facingDirection * 26, bodyY + 26);
      ctx.quadraticCurveTo(
        centerX - this.facingDirection * 50,
        bodyY + 10,
        centerX - this.facingDirection * 40,
        bodyY + 44
      );
      ctx.stroke();

      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 12;

      const runOffset = Math.sin(Date.now() / 120) * 4 * (Math.abs(this.velocityX) > 0 ? 1 : 0);

      ctx.beginPath();
      ctx.moveTo(centerX - 14, bodyY + 36);
      ctx.lineTo(centerX - 18 + runOffset, bodyY + 82);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 14, bodyY + 36);
      ctx.lineTo(centerX + 18 - runOffset, bodyY + 82);
      ctx.stroke();

      const clawReach = this.isAttacking ? 28 : 0;

      ctx.beginPath();
      ctx.moveTo(centerX + this.facingDirection * 18, bodyY + 18);
      ctx.lineTo(centerX + this.facingDirection * (36 + clawReach), bodyY + 26);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX - this.facingDirection * 12, bodyY + 18);
      ctx.lineTo(centerX - this.facingDirection * 28, bodyY + 30);
      ctx.stroke();

      if (this.isAttacking) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX + this.facingDirection * (42 + clawReach), bodyY + 20 + i * 5);
          ctx.lineTo(centerX + this.facingDirection * (54 + clawReach), bodyY + 16 + i * 5);
          ctx.stroke();
        }
      }
    } else if (this.characterType === 'bug') {
      // BUG
      ctx.fillStyle = this.character.color;
      ctx.beginPath();
      ctx.ellipse(centerX, bodyY + 24, 22, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = this.character.headColor;
      ctx.beginPath();
      ctx.arc(centerX, headY + 4, 14, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(centerX - 5, headY, 3, 0, Math.PI * 2);
      ctx.arc(centerX + 5, headY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Antennae
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 4, headY - 10);
      ctx.quadraticCurveTo(centerX - 10, headY - 20, centerX - 14, headY - 26);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 4, headY - 10);
      ctx.quadraticCurveTo(centerX + 10, headY - 20, centerX + 14, headY - 26);
      ctx.stroke();

      // Legs
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 4;
      const legOffset = Math.sin(Date.now() / 150) * 3;

      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX - 16, bodyY + 12 + i * 6);
        ctx.lineTo(centerX - 28 + legOffset, bodyY + 32 + i * 6);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + 16, bodyY + 12 + i * 6);
        ctx.lineTo(centerX + 28 - legOffset, bodyY + 32 + i * 6);
        ctx.stroke();
      }

      // Attack mandibles
      const mandibleExtend = this.isAttacking ? 15 : 0;
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(centerX - 6, headY + 8);
      ctx.lineTo(centerX - 6 - mandibleExtend * this.facingDirection, headY + 14);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerX + 6, headY + 8);
      ctx.lineTo(centerX + 6 - mandibleExtend * this.facingDirection, headY + 14);
      ctx.stroke();
    }

    if (!this.weapon.heal) {
      ctx.strokeStyle = this.weapon.color;
      ctx.lineWidth = this.weaponType === 'knife' ? 5 : 7;

      const weaponLength =
        this.weaponType === 'katana'
          ? 58
          : this.weaponType === 'knife'
          ? 24
          : 40;

      const wx = centerX + this.facingDirection * 20;
      const wy = bodyY + 18;

      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + this.facingDirection * weaponLength, wy - 10);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#f1c27d';
      ctx.beginPath();
      ctx.arc(centerX + this.facingDirection * 24, bodyY + 18, 6, 0, Math.PI * 2);
      ctx.fill();

      if (this.healCooldown > 0) {
        ctx.fillStyle = '#2ecc71';
        ctx.font = '16px Arial';
        ctx.fillText('+HP', centerX - 14, this.y - 10);
      }
    }

    if (this.isBlocking) {
      const shieldX = centerX + this.facingDirection * 34;

      ctx.fillStyle = 'rgba(120,220,255,0.35)';
      ctx.beginPath();
      ctx.arc(shieldX, bodyY + 16, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#9be7ff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();

    if (!this.character) {
      ctx.fillStyle = 'magenta';
      ctx.fillRect(this.x, this.y, 40, 80);
    }
  }
}
