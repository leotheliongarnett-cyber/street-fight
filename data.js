export const gravity = 0.8;
export const floorHeight = 80;

export const characterTypes = {
  human: {
    name: 'Human',
    color: '#e74c3c',
    headColor: '#f1c27d',
    hair: '#222',
    animal: false,
    maxHealth: 15,
    speed: 8
  },
  gorilla: {
    name: 'Gorilla',
    color: '#555',
    headColor: '#444',
    hair: '#222',
    animal: true,
    maxHealth: 50,
    speed: 2
  },
  tiger: {
    name: 'Tiger',
    color: '#ff9933',
    headColor: '#ff9933',
    hair: '#111',
    animal: true,
    maxHealth: 30,
    speed: 6
  },
  lion: {
    name: 'Lion',
    color: '#c89b3c',
    headColor: '#d9b15f',
    hair: '#5a3b11',
    animal: true,
    maxHealth: 40,
    speed: 4
  },
  bug: {
    name: 'Bug',
    color: '#4db84d',
    headColor: '#66c2ff',
    hair: '#1a1a1a',
    animal: true,
    maxHealth: 10,
    speed: 2
  }
};

export const weapons = {
  sword: {
    name: 'Classic Sword',
    damage: 5,
    range: 80,
    color: '#dfe6e9',
    heal: false
  },
  katana: {
    name: 'Katana',
    damage: 2.5,
    range: 160,
    color: '#c7ecee',
    heal: false
  },
  knife: {
    name: 'Knife',
    damage: 10,
    range: 40,
    color: '#b2bec3',
    heal: false
  },
  shot: {
    name: 'Shot',
    damage: 1,
    range: 80,
    color: '#2ecc71',
    heal: true
  }
};

export const platformConfigs = [
  { xFactor: 0.22, yOffset: -140, width: 220, height: 18 },
  { xFactor: 0.62, yOffset: -150, width: 220, height: 18 }
];
