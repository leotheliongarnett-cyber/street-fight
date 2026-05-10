import { characterTypes, weapons } from './data.js';

const DOM = {
  p1Select: null,
  p2Select: null,
  p1WeaponSelect: null,
  p2WeaponSelect: null,
  p1Coins: null,
  p2Coins: null,
  p1Health: null,
  p2Health: null,
  winnerText: null,
  menuScreen: null,
  cpuToggle: null,
  difficultySelect: null,
  startButton: null
};

export function init({ selectedP1, selectedP2, selectedWeapon1, selectedWeapon2, onCharacterSelect, onWeaponSelect, onStart }) {
  DOM.p1Select = document.getElementById('p1Select');
  DOM.p2Select = document.getElementById('p2Select');
  DOM.p1WeaponSelect = document.getElementById('p1WeaponSelect');
  DOM.p2WeaponSelect = document.getElementById('p2WeaponSelect');
  DOM.p1Coins = document.getElementById('p1Coins');
  DOM.p2Coins = document.getElementById('p2Coins');
  DOM.p1Health = document.getElementById('p1Health');
  DOM.p2Health = document.getElementById('p2Health');
  DOM.winnerText = document.getElementById('winnerText');
  DOM.menuScreen = document.getElementById('menuScreen');
  DOM.cpuToggle = document.getElementById('cpuToggle');
  DOM.difficultySelect = document.getElementById('difficultySelect');
  DOM.startButton = document.getElementById('startButton');

  createCharacterMenus(selectedP1, selectedP2, onCharacterSelect);
  createWeaponMenus(selectedWeapon1, selectedWeapon2, onWeaponSelect);
  DOM.startButton.addEventListener('click', onStart);
}

function createCharacterMenus(selectedP1, selectedP2, onCharacterSelect) {
  DOM.p1Select.innerHTML = '';
  DOM.p2Select.innerHTML = '';

  Object.entries(characterTypes).forEach(([key, character]) => {
    const card = createCardButton(key, character, onCharacterSelect);
    DOM.p1Select.appendChild(card);
    const card2 = createCardButton(key, character, onCharacterSelect);
    DOM.p2Select.appendChild(card2);
  });

  updateSelections(selectedP1, selectedP2);
}

function createCardButton(characterKey, character, onCharacterSelect) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'card-button character-card';
  button.dataset.character = characterKey;
  button.innerHTML = `
    <div class="emoji">
      ${characterKey === 'human' ? '🧍' : characterKey === 'gorilla' ? '🦍' : characterKey === 'tiger' ? '🐅' : '🦁'}
    </div>
    ${character.name}
  `;
  button.addEventListener('click', () => {
    const player = button.closest('#p1Select') ? 1 : 2;
    onCharacterSelect(player, characterKey);
  });
  return button;
}

function createWeaponMenus(selectedWeapon1, selectedWeapon2, onWeaponSelect) {
  DOM.p1WeaponSelect.innerHTML = '';
  DOM.p2WeaponSelect.innerHTML = '';

  Object.entries(weapons).forEach(([key, weapon]) => {
    const btn1 = createWeaponButton(key, weapon, onWeaponSelect);
    DOM.p1WeaponSelect.appendChild(btn1);
    const btn2 = createWeaponButton(key, weapon, onWeaponSelect);
    DOM.p2WeaponSelect.appendChild(btn2);
  });

  updateWeaponSelections(selectedWeapon1, selectedWeapon2);
}

function createWeaponButton(weaponKey, weapon, onWeaponSelect) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'card-button weapon-card';
  button.dataset.weapon = weaponKey;
  button.innerHTML = `
    <div class="emoji">
      ${weaponKey === 'sword' ? '🗡️' : weaponKey === 'katana' ? '⚔️' : weaponKey === 'knife' ? '🔪' : '💉'}
    </div>
    <div style="font-weight:bold; margin-bottom:6px;">${weapon.name}</div>
    <div class="weapon-info">
      ${weapon.heal ? 'Heal + fists' : weapon.damage + ' damage'}
    </div>
  `;
  button.addEventListener('click', () => {
    const player = button.closest('#p1WeaponSelect') ? 1 : 2;
    onWeaponSelect(player, weaponKey);
  });
  return button;
}

export function updateSelections(selectedP1, selectedP2) {
  document.querySelectorAll('#p1Select button').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.character === selectedP1);
  });
  document.querySelectorAll('#p2Select button').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.character === selectedP2);
  });
}

export function updateWeaponSelections(selectedWeapon1, selectedWeapon2) {
  document.querySelectorAll('#p1WeaponSelect button').forEach(btn => {
    btn.classList.toggle('highlight', btn.dataset.weapon === selectedWeapon1);
  });
  document.querySelectorAll('#p2WeaponSelect button').forEach(btn => {
    btn.classList.toggle('highlight', btn.dataset.weapon === selectedWeapon2);
  });
}

export function updateHealthBars(player1, player2) {
  DOM.p1Health.style.width = `${(player1.health / player1.maxHealth) * 100}%`;
  DOM.p2Health.style.width = `${(player2.health / player2.maxHealth) * 100}%`;
}

export function updateCoinDisplays(player1, player2) {
  DOM.p1Coins.textContent = Math.floor(player1.coins);
  DOM.p2Coins.textContent = Math.floor(player2.coins);
}

export function hideMenu() {
  DOM.menuScreen.style.display = 'none';
  DOM.winnerText.style.display = 'none';
}

export function showWinner(winner) {
  DOM.winnerText.style.display = 'block';
  DOM.winnerText.innerHTML = `${winner} Wins!<small>Refresh the page to play again</small>`;
}

export function isCpuEnabled() {
  return DOM.cpuToggle.checked;
}

export function getCpuDifficulty() {
  return DOM.difficultySelect.value;
}
