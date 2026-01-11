const MAX_PLAYERS = 8;
const STORAGE_KEY = 'skull-king-scorekeeper';

const defaultCards = [
  {
    id: 'pirate',
    label: 'Pirate capturé',
    description: 'Bonus pour chaque pirate gagné',
    value: 20,
    group: 'Base',
  },
  {
    id: 'mermaid',
    label: 'Sirène victorieuse',
    description: 'Bonus si la sirène bat le Skull King',
    value: 50,
    group: 'Base',
  },
  {
    id: 'skull-king',
    label: 'Skull King capturé',
    description: 'Bonus par Skull King gagné',
    value: 30,
    group: 'Base',
  },
  {
    id: 'tigress-pirate',
    label: 'Tigresse (mode pirate)',
    description: 'Bonus si la Tigresse est jouée comme pirate',
    value: 20,
    group: 'Base',
  },
  {
    id: 'tigress-escape',
    label: 'Tigresse (mode fuite)',
    description: 'Petit bonus si la Tigresse est jouée en fuite',
    value: 10,
    group: 'Base',
  },
  {
    id: 'kraken',
    label: 'Kraken',
    description: 'Carte d\'extension: annule la levée, ajustez selon vos règles.',
    value: 0,
    group: 'Extension',
  },
  {
    id: 'whale',
    label: 'Baleine',
    description: 'Carte d\'extension: bonus selon vos variantes.',
    value: 10,
    group: 'Extension',
  },
  {
    id: 'white-whale',
    label: 'Baleine blanche',
    description: 'Carte d\'extension: effets spéciaux, bonus personnalisable.',
    value: 20,
    group: 'Extension',
  },
  {
    id: 'loot',
    label: 'Butin',
    description: 'Carte d\'extension: ajoutez un bonus maison.',
    value: 10,
    group: 'Extension',
  },
];

const state = {
  players: [
    { id: crypto.randomUUID(), name: 'Capitaine Anne', scores: {} },
    { id: crypto.randomUUID(), name: 'Barbe Noire', scores: {} },
    { id: crypto.randomUUID(), name: 'Mousse Jack', scores: {} },
  ],
  rounds: 10,
  currentRound: 1,
  cards: structuredClone(defaultCards),
};

let activeBonusInput = null;

const playerListEl = document.getElementById('player-list');
const scoreboardEl = document.getElementById('scoreboard');
const roundSelectEl = document.getElementById('round-select');
const roundCountEl = document.getElementById('round-count');
const cardGridEl = document.getElementById('card-grid');
const bonusSettingsEl = document.getElementById('bonus-settings');
const addPlayerBtn = document.getElementById('add-player');
const resetBtn = document.getElementById('reset-game');

const clampNumber = (value, min = 0, max = 99) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
};

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (saved && saved.players && saved.cards) {
      state.players = saved.players;
      state.rounds = saved.rounds ?? state.rounds;
      state.currentRound = saved.currentRound ?? 1;
      state.cards = saved.cards;
    }
  } catch (error) {
    console.warn('Échec de chargement de sauvegarde', error);
  }
};

const ensureScoreEntry = (playerId, round) => {
  const player = state.players.find((item) => item.id === playerId);
  if (!player.scores[round]) {
    player.scores[round] = { bid: 0, tricks: 0, bonus: 0 };
  }
  return player.scores[round];
};

const calculateRoundScore = (roundScore, roundNumber) => {
  const { bid, tricks, bonus } = roundScore;
  if (bid === 0) {
    const value = roundNumber * 10;
    return tricks === 0 ? value + bonus : -value + bonus;
  }
  if (bid === tricks) {
    return bid * 20 + bonus;
  }
  return -Math.abs(bid - tricks) * 10 + bonus;
};

const totalScore = (player) => {
  return Object.entries(player.scores).reduce((total, [round, roundScore]) => {
    return total + calculateRoundScore(roundScore, Number(round));
  }, 0);
};

const renderPlayers = () => {
  playerListEl.innerHTML = '';
  state.players.forEach((player) => {
    const card = document.createElement('div');
    card.className = 'player-card';

    const input = document.createElement('input');
    input.value = player.name;
    input.addEventListener('input', (event) => {
      player.name = event.target.value || 'Pirate mystère';
      renderScoreboard();
      saveState();
    });

    const total = document.createElement('div');
    total.className = 'player-card__total';
    total.textContent = `${totalScore(player)} pts`;

    const remove = document.createElement('button');
    remove.className = 'btn btn--ghost';
    remove.textContent = 'Retirer';
    remove.disabled = state.players.length <= 2;
    remove.addEventListener('click', () => {
      state.players = state.players.filter((item) => item.id !== player.id);
      renderAll();
      saveState();
    });

    card.append(input, total, remove);
    playerListEl.appendChild(card);
  });
};

const renderRounds = () => {
  roundSelectEl.innerHTML = '';
  roundCountEl.innerHTML = '';
  for (let index = 1; index <= state.rounds; index += 1) {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${index} manche${index > 1 ? 's' : ''}`;
    if (index === state.currentRound) option.selected = true;
    roundSelectEl.appendChild(option);
  }
  for (let index = 5; index <= 14; index += 1) {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${index} manches`;
    if (index === state.rounds) option.selected = true;
    roundCountEl.appendChild(option);
  }
};

const renderScoreboard = () => {
  scoreboardEl.innerHTML = '';
  state.players.forEach((player) => {
    const roundScore = ensureScoreEntry(player.id, state.currentRound);
    const row = document.createElement('div');
    row.className = 'score-row';

    const name = document.createElement('div');
    name.className = 'score-row__name';
    name.textContent = player.name;

    const inputs = document.createElement('div');
    inputs.className = 'score-row__inputs';

    const bidInput = document.createElement('input');
    bidInput.type = 'number';
    bidInput.min = '0';
    bidInput.value = roundScore.bid;
    bidInput.placeholder = 'Annonce';
    bidInput.addEventListener('input', (event) => {
      roundScore.bid = clampNumber(event.target.value, 0, state.currentRound);
      updateScores();
    });

    const trickInput = document.createElement('input');
    trickInput.type = 'number';
    trickInput.min = '0';
    trickInput.value = roundScore.tricks;
    trickInput.placeholder = 'Plis';
    trickInput.addEventListener('input', (event) => {
      roundScore.tricks = clampNumber(event.target.value, 0, state.currentRound);
      updateScores();
    });

    const bonusInput = document.createElement('input');
    bonusInput.type = 'number';
    bonusInput.value = roundScore.bonus;
    bonusInput.placeholder = 'Bonus';
    bonusInput.addEventListener('input', (event) => {
      roundScore.bonus = Number(event.target.value) || 0;
      updateScores();
    });
    bonusInput.addEventListener('focus', () => {
      activeBonusInput = bonusInput;
    });

    inputs.append(bidInput, trickInput, bonusInput);

    const score = document.createElement('div');
    score.className = 'score-row__score';
    const value = calculateRoundScore(roundScore, state.currentRound);
    score.innerHTML = `Score: <span>${value}</span>`;

    row.append(name, inputs, score);
    scoreboardEl.appendChild(row);
  });
};

const renderCardGrid = () => {
  cardGridEl.innerHTML = '';
  state.cards.forEach((card) => {
    const button = document.createElement('button');
    button.className = 'card-button';
    button.type = 'button';
    button.innerHTML = `
      <div class="card-button__label">${card.label}</div>
      <div class="card-button__value">${card.group} · ${card.value >= 0 ? '+' : ''}${card.value} pts</div>
    `;
    button.addEventListener('click', () => {
      if (!activeBonusInput) {
        alert('Sélectionne d\'abord un champ bonus dans la manche.');
        return;
      }
      const current = Number(activeBonusInput.value) || 0;
      activeBonusInput.value = current + card.value;
      activeBonusInput.dispatchEvent(new Event('input'));
    });
    cardGridEl.appendChild(button);
  });
};

const renderBonusSettings = () => {
  bonusSettingsEl.innerHTML = '';
  state.cards.forEach((card) => {
    const row = document.createElement('div');
    row.className = 'bonus-setting';

    const label = document.createElement('div');
    label.innerHTML = `<strong>${card.label}</strong><br /><small>${card.description}</small>`;

    const input = document.createElement('input');
    input.type = 'number';
    input.value = card.value;
    input.addEventListener('input', (event) => {
      card.value = Number(event.target.value) || 0;
      renderCardGrid();
      saveState();
    });

    row.append(label, input);
    bonusSettingsEl.appendChild(row);
  });
};

const updateScores = () => {
  renderScoreboard();
  renderPlayers();
  saveState();
};

const renderAll = () => {
  renderRounds();
  renderPlayers();
  renderScoreboard();
  renderCardGrid();
  renderBonusSettings();
};

addPlayerBtn.addEventListener('click', () => {
  if (state.players.length >= MAX_PLAYERS) {
    alert('Le navire est plein !');
    return;
  }
  state.players.push({
    id: crypto.randomUUID(),
    name: `Pirate ${state.players.length + 1}`,
    scores: {},
  });
  renderAll();
  saveState();
});

resetBtn.addEventListener('click', () => {
  if (!confirm('Réinitialiser tous les scores ?')) return;
  state.players.forEach((player) => {
    player.scores = {};
  });
  state.currentRound = 1;
  renderAll();
  saveState();
});

roundSelectEl.addEventListener('change', (event) => {
  state.currentRound = Number(event.target.value) || 1;
  renderScoreboard();
  saveState();
});

roundCountEl.addEventListener('change', (event) => {
  state.rounds = Number(event.target.value) || 10;
  if (state.currentRound > state.rounds) {
    state.currentRound = state.rounds;
  }
  renderRounds();
  renderScoreboard();
  saveState();
});

loadState();
if (state.currentRound > state.rounds) {
  state.currentRound = state.rounds;
}
renderAll();
