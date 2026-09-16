let coins = 0;
let baseClickValue = 1;
let cps = 0;
let soundEnabled = true;
let buyAmount = 1;
const lifetimeStats = {
  clicks: 0,
  coinsEarned: 0,
  upgradesBought: 0,
  pouchesOpened: 0,
  eventCoinsCollected: 0
};
const unlockedAchievements = new Set();
const recentClickTimes = [];

const achievements = [
  { id: 'first-click', icon: '👆', name: 'First Click', description: 'Click the coin once.', test: () => lifetimeStats.clicks >= 1 },
  { id: 'click-100', icon: '💪', name: 'Getting Stronger', description: 'Click the coin 100 times.', test: () => lifetimeStats.clicks >= 100 },
  { id: 'player-clicks-30', icon: '⚡', name: 'Nice autoclicker', description: 'Click the coin 30 times in one second.', test: () => getPlayerClicksPerSecond() >= 30 },
  { id: 'earn-1000', icon: '🪙', name: 'Pocket Change', description: 'Earn 1,000 coins over time.', test: () => lifetimeStats.coinsEarned >= 1000 },
  { id: 'first-upgrade', icon: '🔧', name: 'First Improvement', description: 'Buy your first upgrade.', test: () => lifetimeStats.upgradesBought >= 1 },
  { id: 'upgrade-25', icon: '🏭', name: 'Industrial Mint', description: 'Buy 25 upgrades.', test: () => lifetimeStats.upgradesBought >= 25 },
  { id: 'tier-3', icon: '🥇', name: 'Golden Age', description: 'Reach the Gold Coin tier.', test: () => currentCoinTier >= 3 },
  { id: 'cosmic-tier', icon: '🌌', name: 'To the Stars', description: 'Reach the Cosmic Coin tier.', test: () => currentCoinTier >= 6 },
  { id: 'cps-100', icon: '⚙️', name: 'Automated Fortune', description: 'Reach 100 CPS.', test: () => cps * getCpsMultiplier() >= 100 },
  { id: 'first-pouch', icon: '💰', name: 'Lucky Draw', description: 'Open a money pouch.', test: () => lifetimeStats.pouchesOpened >= 1 },
  { id: 'event-10', icon: '✨', name: 'Event Collector', description: 'Collect 10 special event coins.', test: () => lifetimeStats.eventCoinsCollected >= 10 }
];

let tempMultiplier = 1;
let boostTimer = null;
let specialEventTimer = null;

const milestoneUpgrades = [
  { id: 'reinforced-finger', name: 'Reinforced Finger', unlockLevel: 25, cost: 2500, description: '+25% Click Power', clickMultiplier: 1.25 },
  { id: 'coin-magnet', name: 'Coin Magnet', unlockLevel: 50, cost: 10000, description: '+25% CPS and unlocks the Treasure Coin event', cpsMultiplier: 1.25, specialEvent: true },
  { id: 'quick-hands', name: 'Quick Hands', unlockLevel: 75, cost: 30000, description: 'Golden Coins appear 15% more frequently', goldenCoinDelayMultiplier: 0.85 },
  { id: 'efficient-mint', name: 'Efficient Mint', unlockLevel: 100, cost: 75000, description: '+20% CPS', cpsMultiplier: 1.2 },
  { id: 'heavy-strike', name: 'Heavy Strike', unlockLevel: 125, cost: 150000, description: '+50% Click Power', clickMultiplier: 1.5 },
  { id: 'event-hunter', name: 'Event Hunter', unlockLevel: 150, cost: 300000, description: 'Golden Coins and Money Pouches appear 20% more frequently', goldenCoinDelayMultiplier: 0.8, pouchDelayMultiplier: 0.8 },
  { id: 'golden-ledger', name: 'Golden Ledger', unlockLevel: 175, cost: 600000, description: '+25% Money Pouch rewards', pouchRewardMultiplier: 1.25 },
  { id: 'fortune-engine', name: 'Fortune Engine', unlockLevel: 200, cost: 1200000, description: '+50% CPS', cpsMultiplier: 1.5 },
  { id: 'critical-click', name: 'Critical Click', unlockLevel: 225, cost: 2500000, description: '+100% Click Power', clickMultiplier: 2 },
  { id: 'rapid-pouches', name: 'Rapid Pouches', unlockLevel: 250, cost: 5000000, description: 'Money Pouches appear 25% more frequently', pouchDelayMultiplier: 0.75 },
  { id: 'royal-mint', name: 'Royal Mint', unlockLevel: 275, cost: 10000000, description: '+50% CPS and +25% Money Pouch rewards', cpsMultiplier: 1.5, pouchRewardMultiplier: 1.25 },
  { id: 'cosmic-touch', name: 'Cosmic Touch', unlockLevel: 300, cost: 25000000, description: '+100% Click Power and +25% event frequency', clickMultiplier: 2, goldenCoinDelayMultiplier: 0.75, pouchDelayMultiplier: 0.75 }
];

const purchasedMilestoneUpgrades = new Set();

let currentCoinTier = 0;
const coinTiers = [
  {
    name: 'Copper Coin',
    cost: 500,
    reqUpgrades: 5,
    description: '+10% Click Power & +10% CPS'
  },
  {
    name: 'Silver Coin',
    cost: 5000,
    reqUpgrades: 15,
    description: 'Golden Coins appear 33% more frequently'
  },
  {
    name: 'Gold Coin',
    cost: 25000,
    reqUpgrades: 30,
    description: 'Money Pouch events trigger 20% faster & boost lasts 75s'
  },
  {
    name: 'Platinum Coin',
    cost: 100000,
    reqUpgrades: 50,
    description: 'All upgrades in the upgrade tab are 10% cheaper'
  },
  {
    name: 'Diamond Coin',
    cost: 500000,
    reqUpgrades: 80,
    description: 'Money Pouches yield double rewards'
  },
  {
    name: 'Cosmic Coin',
    cost: 2500000,
    reqUpgrades: 120,
    description: '+100% Base CPS & Click Power multiplier'
  }
];

function getClickPowerMultiplier() {
  return getAchievementMultiplier() * (currentCoinTier >= 1 ? 1.1 : 1) * (currentCoinTier >= 6 ? 2 : 1) * getMilestoneMultiplier('clickMultiplier');
}

function getCpsMultiplier() {
  return getAchievementMultiplier() * (currentCoinTier >= 1 ? 1.1 : 1) * (currentCoinTier >= 6 ? 2 : 1) * getMilestoneMultiplier('cpsMultiplier');
}

function getAchievementMultiplier() {
  return Math.pow(1.1, unlockedAchievements.size);
}

function getMilestoneMultiplier(property) {
  return milestoneUpgrades
    .filter((upgrade) => purchasedMilestoneUpgrades.has(upgrade.id))
    .reduce((multiplier, upgrade) => multiplier * (upgrade[property] || 1), 1);
}

function getUpgradeCost(cost) {
  return currentCoinTier >= 4 ? Math.max(1, Math.floor(cost * 0.9)) : cost;
}

function getCoinTierCost(cost) {
  return currentCoinTier >= 4 ? Math.max(1, Math.floor(cost * 0.9)) : cost;
}

function getPouchDelayMs() {
  const delayMs = (Math.floor(Math.random() * 300) + 300) * 1000;
  const tierMultiplier = currentCoinTier >= 3 ? 0.8 : 1;
  return Math.floor(delayMs * tierMultiplier * getMilestoneMultiplier('pouchDelayMultiplier'));
}

function getGoldenCoinDelayMs() {
  const delayMs = (Math.floor(Math.random() * 180) + 120) * 1000;
  const tierMultiplier = currentCoinTier >= 2 ? 2 / 3 : 1;
  return Math.floor(delayMs * tierMultiplier * getMilestoneMultiplier('goldenCoinDelayMultiplier'));
}

function getBoostDuration() {
  return currentCoinTier >= 3 ? 75 : 60;
}

function getPouchRewardMultiplier() {
  const tierMultiplier = currentCoinTier >= 5 ? 2 : 1;
  return tierMultiplier * getMilestoneMultiplier('pouchRewardMultiplier');
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (!soundEnabled) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'click') {
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'upgrade') {
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.setValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'event') {
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

const scoreDisplay = document.getElementById('punktuskaits');
const cpsDisplay = document.getElementById('cps-display');
const mainCoin = document.getElementById('main-coin');
const fallingCoinsContainer = document.getElementById('falling-coins');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const soundToggle = document.getElementById('sound-toggle');
const pouchModal = document.getElementById('pouch-modal');
const saveButton = document.getElementById('save-btn');
const loadButton = document.getElementById('load-btn');
const saveStatus = document.getElementById('save-status');
const achievementsBtn = document.getElementById('achievements-btn');
const achievementsModal = document.getElementById('achievements-modal');
const closeAchievements = document.getElementById('close-achievements');
const achievementList = document.getElementById('achievement-list');
const achievementProgress = document.getElementById('achievement-progress');

const upgrades = [
  { id: 'strength', name: 'Click Power (+1)', cost: 15, type: 'click', power: 1, count: 0 },
  { id: 'auto', name: 'Auto Clicker (+1 CPS)', cost: 50, type: 'cps', power: 1, count: 0 },
  { id: 'heavy_mint', name: 'Heavy Mint (+5 CPS)', cost: 250, type: 'cps', power: 5, count: 0 },
  { id: 'gold_touch', name: 'Golden Touch (+10 Click)', cost: 1000, type: 'click', power: 10, count: 0 }
];


document.querySelectorAll('.purchase-option').forEach(btn => {
  btn.onclick = (e) => {
    document.querySelectorAll('.purchase-option').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const val = e.target.getAttribute('data-amount');
    buyAmount = val === 'max' ? 'max' : parseInt(val, 10);
    renderUpgrades();
  };
});

mainCoin.addEventListener('click', (e) => {
  recordPlayerClick();
  const earned = baseClickValue * getClickPowerMultiplier() * tempMultiplier;
  coins += earned;
  lifetimeStats.clicks += 1;
  lifetimeStats.coinsEarned += earned;
  playSound('click');
  createFloatingText(e.clientX, e.clientY, `+${Math.floor(earned)}¢`);
  spawnFallingCoin();
  updateUI();
});

function recordPlayerClick() {
  const now = performance.now();
  recentClickTimes.push(now);
  while (recentClickTimes[0] <= now - 1000) recentClickTimes.shift();
}

function getPlayerClicksPerSecond() {
  const now = performance.now();
  while (recentClickTimes[0] <= now - 1000) recentClickTimes.shift();
  return recentClickTimes.length;
}

function spawnFallingCoin() {
  const particle = document.createElement('div');
  particle.className = `falling-coin tier-${currentCoinTier}`;
  const size = Math.floor(Math.random() * 20) + 24;
  const startX = Math.random() * (window.innerWidth - 40);
  const drift = (Math.random() - 0.5) * 150;
  const duration = (Math.random() * 1.5) + 1.5;

  particle.style.setProperty('--coin-size', `${size}px`);
  particle.style.setProperty('--drift', `${drift}px`);
  particle.style.setProperty('--fall-duration', `${duration}s`);
  particle.style.left = `${startX}px`;

  fallingCoinsContainer.appendChild(particle);
  setTimeout(() => particle.remove(), duration * 1000);
}

function createFloatingText(x, y, text) {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.innerText = text;
  el.style.left = `${x - 20}px`;
  el.style.top = `${y - 20}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function showPouchReward(text) {
  const el = document.createElement('div');
  el.className = 'pouch-reward-text';
  el.innerText = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

function getTotalUpgradesCount() {
  return upgrades.reduce((sum, u) => sum + u.count, 0);
}

function renderUpgrades() {
  const list = document.getElementById('upgrade-list');
  list.innerHTML = '';

  if (currentCoinTier < coinTiers.length) {
    const nextTier = coinTiers[currentCoinTier];
    const currentTotalUpgrades = getTotalUpgradesCount();
    const tierCost = getCoinTierCost(nextTier.cost);
    const canAfford = coins >= tierCost && currentTotalUpgrades >= nextTier.reqUpgrades;

    const coinBtn = document.createElement('button');
    coinBtn.className = 'upgrade-slot coin-upgrade';
    coinBtn.disabled = !canAfford;
    coinBtn.innerHTML = `
      <div>
        <div><strong>Upgrade: ${nextTier.name}</strong></div>
        <small>Tier ${currentCoinTier + 1}: ${nextTier.description}</small><br>
        <small>Req: ${nextTier.reqUpgrades} upgrades bought</small>
      </div>
      <strong>${tierCost}¢</strong>
    `;
    coinBtn.onclick = () => buyCoinTierUpgrade(nextTier);
    list.appendChild(coinBtn);
  }

  upgrades.forEach((u) => {
    const countToBuy = calculateBuyCount(u);
    const totalCost = calculateTotalCost(u, countToBuy);

    const btn = document.createElement('button');
    btn.className = 'upgrade-slot';
    btn.disabled = countToBuy <= 0 || coins < totalCost;
    btn.innerHTML = `
      <span>${u.name} (Lvl ${u.count}) ${countToBuy > 1 ? `[+${countToBuy}]` : ''}</span>
      <strong>${totalCost}¢</strong>
    `;
    btn.onclick = () => buyUpgrade(u, countToBuy, totalCost);
    list.appendChild(btn);
  });

  const clickPowerLevel = upgrades.find((upgrade) => upgrade.id === 'strength').count;
  milestoneUpgrades.forEach((upgrade) => {
    const unlocked = clickPowerLevel >= upgrade.unlockLevel;
    if (!unlocked) return;

    const purchased = purchasedMilestoneUpgrades.has(upgrade.id);
    const milestoneBtn = document.createElement('button');
    milestoneBtn.className = 'upgrade-slot milestone-upgrade';
    milestoneBtn.disabled = !unlocked || purchased || coins < upgrade.cost;
    milestoneBtn.innerHTML = `
      <span>
        <strong>${upgrade.name}</strong> (Click Power ${upgrade.unlockLevel})<br>
        <small>${upgrade.description}</small>
      </span>
      <strong>${purchased ? 'OWNED' : `${upgrade.cost}¢`}</strong>
    `;
    milestoneBtn.onclick = () => buyMilestoneUpgrade(upgrade);
    list.appendChild(milestoneBtn);
  });
}

function calculateBuyCount(u) {
  if (buyAmount === 'max') {
    let tempCost = getUpgradeCost(u.cost);
    let tempCoins = coins;
    let count = 0;
    while (tempCoins >= tempCost) {
      tempCoins -= tempCost;
      count += 1;
      tempCost = getUpgradeCost(Math.floor(u.cost * Math.pow(1.15, count)));
    }
    return count;
  }
  return buyAmount;
}

function calculateTotalCost(u, count) {
  let total = 0;
  let currentCost = u.cost;
  for (let i = 0; i < count; i++) {
    total += getUpgradeCost(currentCost);
    currentCost = Math.floor(currentCost * 1.15);
  }
  return total;
}

function buyUpgrade(u, count, totalCost) {
  if (count > 0 && coins >= totalCost) {
    coins -= totalCost;
    for (let i = 0; i < count; i++) {
      if (u.type === 'click') baseClickValue += u.power;
      if (u.type === 'cps') cps += u.power;
      u.cost = Math.floor(u.cost * 1.15);
    }
    u.count += count;
    lifetimeStats.upgradesBought += count;
    playSound('upgrade');
    updateUI();
  }
}

function buyMilestoneUpgrade(upgrade) {
  const clickPowerLevel = upgrades.find((item) => item.id === 'strength').count;
  if (purchasedMilestoneUpgrades.has(upgrade.id) || clickPowerLevel < upgrade.unlockLevel || coins < upgrade.cost) return;

  coins -= upgrade.cost;
  purchasedMilestoneUpgrades.add(upgrade.id);
  if (upgrade.specialEvent) scheduleNextTreasureCoinEvent();
  playSound('upgrade');
  updateUI();
}

function buyCoinTierUpgrade(tier) {
  const tierCost = getCoinTierCost(tier.cost);
  if (coins >= tierCost && getTotalUpgradesCount() >= tier.reqUpgrades) {
    coins -= tierCost;
    mainCoin.classList.remove(`tier-${currentCoinTier}`);
    currentCoinTier++;
    mainCoin.classList.add(`tier-${currentCoinTier}`);
    document.querySelectorAll('.falling-coin').forEach((coin) => {
      coin.className = `falling-coin tier-${currentCoinTier}`;
    });
    playSound('event');
    updateUI();
  }
}

setInterval(() => {
  if (cps > 0) {
    const earned = cps * getCpsMultiplier() * tempMultiplier;
    coins += earned;
    lifetimeStats.coinsEarned += earned;
    updateUI();
  }
}, 1000);

function scheduleNextPouchEvent() {
  const delayMs = getPouchDelayMs();
  setTimeout(() => {
    pouchModal.classList.remove('hidden');
    scheduleNextPouchEvent();
  }, delayMs);
}
scheduleNextPouchEvent();

document.querySelectorAll('.pouch').forEach((pouch) => {
  pouch.onclick = () => {
    lifetimeStats.pouchesOpened += 1;
    const rewardType = Math.floor(Math.random() * 3);
    if (rewardType === 0) {
      const reward = (Math.floor(Math.random() * 2000) + 500) * getPouchRewardMultiplier() * getAchievementMultiplier();
      coins += reward;
      lifetimeStats.coinsEarned += reward;
      showPouchReward(`Pouch Reward: +${reward}¢!`);
    } else if (rewardType === 1) {
      const duration = getBoostDuration();
      activateTempBoost(duration);
      showPouchReward(`Pouch Reward: 2x Multiplier activated for ${duration} seconds!`);
    } else {
      const pouchCps = 5 * getPouchRewardMultiplier() * getAchievementMultiplier();
      cps += pouchCps;
      showPouchReward(`Pouch Reward: +${pouchCps} Permanent CPS!`);
    }
    playSound('event');
    pouchModal.classList.add('hidden');
    updateUI();
  };
});

function scheduleGoldenCoinEvent() {
  const delayMs = getGoldenCoinDelayMs();
  setTimeout(() => {
    spawnGoldenCoin();
    scheduleGoldenCoinEvent();
  }, delayMs);
}
scheduleGoldenCoinEvent();

function scheduleNextTreasureCoinEvent() {
  if (!purchasedMilestoneUpgrades.has('coin-magnet')) return;
  clearTimeout(specialEventTimer);
  const delayMs = (Math.floor(Math.random() * 120) + 90) * 1000;
  specialEventTimer = setTimeout(() => {
    spawnTreasureCoin();
    scheduleNextTreasureCoinEvent();
  }, delayMs);
}

function spawnTreasureCoin() {
  const treasureCoin = document.createElement('div');
  treasureCoin.id = 'treasure-coin-event';
  treasureCoin.style.top = `${Math.random() * (window.innerHeight - 100) + 20}px`;
  treasureCoin.style.left = `${Math.random() * (window.innerWidth - 420) + 20}px`;
  treasureCoin.onclick = () => {
    const reward = Math.max(100, Math.floor((cps + baseClickValue) * 10 * getAchievementMultiplier()));
    coins += reward;
    lifetimeStats.coinsEarned += reward;
    lifetimeStats.eventCoinsCollected += 1;
    showPouchReward(`Treasure Coin: +${reward}¢!`);
    playSound('event');
    treasureCoin.remove();
  };
  document.body.appendChild(treasureCoin);
  setTimeout(() => { if (treasureCoin.parentNode) treasureCoin.remove(); }, 15000);
}

function spawnGoldenCoin() {
  const gCoin = document.createElement('div');
  gCoin.id = 'golden-coin-event';
  gCoin.style.top = `${Math.random() * (window.innerHeight - 100) + 20}px`;
  gCoin.style.left = `${Math.random() * (window.innerWidth - 420) + 20}px`;

  gCoin.onclick = () => {
    lifetimeStats.eventCoinsCollected += 1;
    activateTempBoost(getBoostDuration());
    playSound('event');
    gCoin.remove();
  };

  document.body.appendChild(gCoin);
  setTimeout(() => { if (gCoin.parentNode) gCoin.remove(); }, 12000);
}

function activateTempBoost(seconds) {
  tempMultiplier = 2;
  if (boostTimer) clearTimeout(boostTimer);
  boostTimer = setTimeout(() => {
    tempMultiplier = 1;
    updateUI();
  }, seconds * 1000);
  updateUI();
}

settingsBtn.onclick = () => settingsModal.classList.remove('hidden');
closeSettings.onclick = () => settingsModal.classList.add('hidden');
soundToggle.onchange = (e) => { soundEnabled = e.target.checked; };

function getGameState() {
  return {
    coins,
    baseClickValue,
    cps,
    currentCoinTier,
    lifetimeStats: { ...lifetimeStats },
    unlockedAchievements: [...unlockedAchievements],
    milestoneUpgrades: [...purchasedMilestoneUpgrades],
    upgrades: upgrades.map(({ id, cost, count }) => ({ id, cost, count }))
  };
}

function setSaveStatus(message) {
  saveStatus.innerText = message;
}

async function saveGame({ silent = false } = {}) {
  try {
    if (!silent) setSaveStatus('Saving...');
    const response = await fetch('php/save.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getGameState())
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Save failed');
    if (!silent) setSaveStatus('Game saved.');
    return true;
  } catch (error) {
    if (!silent) setSaveStatus(`Save error: ${error.message}`);
    else console.error('Autosave failed:', error);
    return false;
  }
}

async function loadGame({ silent = false } = {}) {
  try {
    if (!silent) setSaveStatus('Loading...');
    const response = await fetch('php/load.php');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Load failed');
    if (!result.data) {
      if (!silent) setSaveStatus('No saved game found.');
      return false;
    }

    const state = result.data;
    coins = Number(state.coins) || 0;
    baseClickValue = Number(state.baseClickValue) || 1;
    cps = Number(state.cps) || 0;
    currentCoinTier = Math.max(0, Math.min(Number(state.currentCoinTier) || 0, coinTiers.length));

    const hasSavedLifetimeStats = state.lifetimeStats && typeof state.lifetimeStats === 'object';
    Object.keys(lifetimeStats).forEach((stat) => {
      lifetimeStats[stat] = Number(state.lifetimeStats?.[stat]) || 0;
    });
    unlockedAchievements.clear();
    if (Array.isArray(state.unlockedAchievements)) {
      state.unlockedAchievements.forEach((achievementId) => {
        if (achievements.some((achievement) => achievement.id === achievementId)) {
          unlockedAchievements.add(achievementId);
        }
      });
    }

    purchasedMilestoneUpgrades.clear();
    if (Array.isArray(state.milestoneUpgrades)) {
      state.milestoneUpgrades.forEach((upgradeId) => {
        if (milestoneUpgrades.some((upgrade) => upgrade.id === upgradeId)) {
          purchasedMilestoneUpgrades.add(upgradeId);
        }
      });
    }

    if (Array.isArray(state.upgrades)) {
      state.upgrades.forEach((savedUpgrade) => {
        const upgrade = upgrades.find((item) => item.id === savedUpgrade.id);
        if (upgrade) {
          upgrade.cost = Number(savedUpgrade.cost) || upgrade.cost;
          upgrade.count = Number(savedUpgrade.count) || 0;
        }
      });
    }
    if (!hasSavedLifetimeStats) {
      lifetimeStats.coinsEarned = Math.max(coins, 0);
      lifetimeStats.upgradesBought = getTotalUpgradesCount();
    }

    mainCoin.className = `coin tier-${currentCoinTier}`;
    if (purchasedMilestoneUpgrades.has('coin-magnet')) scheduleNextTreasureCoinEvent();
    updateUI();
    if (!silent) setSaveStatus('Game loaded.');
    return true;
  } catch (error) {
    if (!silent) setSaveStatus(`Load error: ${error.message}`);
    else console.error('Could not load saved game:', error);
    return false;
  }
}

saveButton.onclick = () => saveGame();
loadButton.onclick = () => loadGame();

const autosaveInterval = 3 * 60 * 1000;
setInterval(() => saveGame({ silent: true }), autosaveInterval);

window.addEventListener('beforeunload', () => {
  const payload = new Blob([JSON.stringify(getGameState())], { type: 'application/json' });
  navigator.sendBeacon('php/save.php', payload);
});

function updateUI() {
  checkAchievements();
  scoreDisplay.innerText = `${Math.floor(coins)}¢`;
  const displayedCps = cps * getCpsMultiplier() * tempMultiplier;
  const displayedClickPower = baseClickValue * getClickPowerMultiplier() * tempMultiplier;
  cpsDisplay.innerText = `${displayedCps} CPS | +${displayedClickPower}/click ${tempMultiplier > 1 ? '(2x Boost Active!)' : ''}`;
  renderUpgrades();
}

function checkAchievements() {
  let unlockedNewAchievement = false;
  achievements.forEach((achievement) => {
    if (!unlockedAchievements.has(achievement.id) && achievement.test()) {
      unlockedAchievements.add(achievement.id);
      unlockedNewAchievement = true;
      showAchievementUnlock(achievement);
    }
  });
  if (unlockedNewAchievement) renderAchievements();
}

function showAchievementUnlock(achievement) {
  const el = document.createElement('div');
  el.className = 'achievement-unlock';
  el.innerHTML = `<span class="achievement-unlock-icon">${achievement.icon}</span><span><strong>Achievement unlocked</strong><small>${achievement.name} · Coin multiplier ${getAchievementMultiplier().toFixed(2)}x</small></span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function renderAchievements() {
  const unlockedCount = achievements.filter((achievement) => unlockedAchievements.has(achievement.id)).length;
  achievementProgress.innerText = `${unlockedCount} / ${achievements.length} unlocked`;
  achievementList.innerHTML = achievements.map((achievement) => {
    const unlocked = unlockedAchievements.has(achievement.id);
    return `<div class="achievement${unlocked ? '' : ' locked'}">
      <span class="achievement-icon">${unlocked ? achievement.icon : '🔒'}</span>
      <span class="achievement-copy"><strong>${achievement.name}</strong><small>${achievement.description}</small></span>
    </div>`;
  }).join('');
}

achievementsBtn.onclick = () => {
  renderAchievements();
  achievementsModal.classList.remove('hidden');
};
closeAchievements.onclick = () => achievementsModal.classList.add('hidden');

updateUI();
loadGame({ silent: true });s