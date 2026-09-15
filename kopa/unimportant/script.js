// Cache the main UI elements once so event handlers and timers can update them efficiently.
const btn = document.querySelector(".coin");
const display = document.getElementById("punktuskaits");
const status = document.getElementById("game-status");
const upgradeSlots = document.querySelectorAll(".upgrade-slot");
const purchaseOptions = document.querySelectorAll(".purchase-option");
const bonusCoin = document.getElementById("bonus-coin");
const fallingCoins = document.getElementById("falling-coins");
const milestoneGrid = document.getElementById("milestone-grid");
const finalUpgrade = document.getElementById("final-upgrade");
const eventMessage = document.getElementById("event-message");

// Progress is stored as plain numbers in localStorage. Missing or invalid values start at zero.
let count = Number.parseInt(localStorage.getItem("clickCount"), 10) || 0;
const savedState = JSON.parse(localStorage.getItem("upgradeState") || "{}");
const levels = savedState.levels || {};
const milestonePurchases = savedState.milestones || {};

// These are derived statistics. They are recalculated whenever an upgrade changes level.
let totalCps = 0;
let clickBonus = 0;
let goldenTouch = 0;
let critChance = 0;
let multiplier = 1;
let bonusActiveUntil = 0;
let bonusEventTimer;
let waveCoins = 0;
let waveReward = 1;
// The selected batch size applies to repeatable upgrades: 1, 10, 100, or every affordable level.
let purchaseAmount = 1;

// Upgrade data is kept in one table so button rendering and purchase logic use the same values.
// Repeatable upgrades use the exponential cost formula: base cost * 1.15^current level.
const upgrades = {
  piggy: { name: "Auto Clicker", baseCost: 10, cps: 1, repeatable: true },
  copper: { name: "Click Power", baseCost: 25, click: 1, repeatable: true },
  minting: { name: "Heavy Mint", baseCost: 100, click: 5, repeatable: true },
  golden: { name: "Golden Touch", baseCost: 500, golden: 0.01, repeatable: true },
  mint: { name: "Coin Mint", baseCost: 150, cps: 10, repeatable: true },
  detectorists: { name: "Metal Detectorists", baseCost: 1000, cps: 50, repeatable: true },
  diver: { name: "Treasure Diver", baseCost: 10000, cps: 250, repeatable: true },
  reserve: { name: "Federal Reserve", baseCost: 100000, cps: 1000, repeatable: true },
  lucky: { name: "Lucky Minting", baseCost: 2500, crit: 0.05, repeatable: true, max: 5 },
  magnet: { name: "Coin Magnet", baseCost: 5000, magnet: true },
  interest: { name: "Vault Interest", baseCost: 10000, interest: true },
  alchemist: { name: "Alchemist's Furnace", baseCost: 25000, multiplier: 1.5 },
  timeWarp: { name: "Time Warp", baseCost: 50000, timeWarp: true }
};

const milestoneData = {
  copper: [
    { level: 25, name: "Chrome Fingers", text: "+25% click power", cost: 2500, effect: "click25" },
    { level: 50, name: "Combo Training", text: "Click streaks grow 50% faster", cost: 15000, effect: "streak" },
    { level: 75, name: "Coin Cascade", text: "Golden coins trigger a 4-8 coin wave", cost: 75000, effect: "wave" },
    { level: 100, name: "Infinite Click", text: "Clicks are tripled and never crit for less", cost: 250000, effect: "click100" }
  ],
  piggy: [
    { level: 25, name: "Efficient Gears", text: "+25% CPS", cost: 2500, effect: "cps25" },
    { level: 50, name: "Lucky Schedule", text: "Bonus events appear twice as often", cost: 15000, effect: "eventRate" },
    { level: 75, name: "Pouch Parade", text: "Bonus events gain two extra pouches", cost: 75000, effect: "pouches" },
    { level: 100, name: "Clockwork Empire", text: "CPS is multiplied by 5", cost: 250000, effect: "cps100" }
  ],
  minting: [
    { level: 25, name: "Bigger Dies", text: "+25% click power", cost: 10000, effect: "click25" },
    { level: 50, name: "Festival Mint", text: "Mint Frenzy events appear", cost: 30000, effect: "mintEvent" },
    { level: 75, name: "Royal Pouches", text: "Pouches scale with your fortune", cost: 125000, effect: "pouches" },
    { level: 100, name: "The Golden Press", text: "All event rewards are x10", cost: 500000, effect: "event100" }
  ],
  golden: [
    { level: 25, name: "Gilded Edge", text: "+25% CPS from Golden Touch", cost: 50000, effect: "gold25" },
    { level: 50, name: "Shiny Magnet", text: "Golden coins stay visible 50% longer", cost: 100000, effect: "goldTime" },
    { level: 75, name: "Wild Fortune", text: "Every multiplier coin is randomised", cost: 300000, effect: "randomMultiplier" },
    { level: 100, name: "Midas Engine", text: "Golden rewards are x25", cost: 1000000, effect: "gold100" }
  ]
};

const mainMilestoneKeys = Object.keys(milestoneData);

function formatNumber(value) {
  // Floor the display value so fractional CPS bonuses never show as partial coins.
  return Math.floor(value).toLocaleString();
}

function getCost(upgrade, level) {
  // Every new level costs 15% more than the previous level.
  return Math.ceil(upgrade.baseCost * (1.15 ** level));
}

function getAffordableAmount(upgrade, level, requestedAmount) {
  // One-time upgrades ignore the selected batch size and can only be bought once.
  if (!upgrade.repeatable) {
    return 1;
  }

  // Respect both the user's requested batch size and an upgrade's maximum level.
  const levelLimit = upgrade.max ? upgrade.max - level : Number.MAX_SAFE_INTEGER;
  const requestedLimit = requestedAmount === "max" ? Number.MAX_SAFE_INTEGER : requestedAmount;
  const maximum = Math.min(levelLimit, requestedLimit);
  let amount = 0;
  let totalCost = 0;

  // Costs change after each level, so each possible purchase must be priced separately.
  while (amount < maximum) {
    const nextCost = getCost(upgrade, level + amount);
    if (totalCost + nextCost > count) {
      break;
    }
    totalCost += nextCost;
    amount++;
  }

  return amount;
}

function getBatchCost(upgrade, level, amount) {
  // Add the prices for consecutive levels instead of multiplying the first price.
  let totalCost = 0;
  for (let index = 0; index < amount; index++) {
    totalCost += getCost(upgrade, level + index);
  }
  return totalCost;
}

function calculateStats() {
  // Rebuild all derived bonuses from saved levels to keep the game state consistent.
  totalCps = 0;
  clickBonus = 0;
  goldenTouch = 0;
  critChance = 0;
  multiplier = levels.alchemist ? 1.5 : 1;

  Object.entries(upgrades).forEach(([key, upgrade]) => {
    const level = levels[key] || 0;
    totalCps += (upgrade.cps || 0) * level;
    clickBonus += (upgrade.click || 0) * level;
    goldenTouch += (upgrade.golden || 0) * level;
    critChance += (upgrade.crit || 0) * Math.min(level, upgrade.max || level);
  });

  const purchased = (effect) => Object.values(milestonePurchases).some((effects) => effects.includes(effect));
  if (purchased("cps25")) totalCps *= 1.25;
  if (purchased("cps100")) totalCps *= 5;
  if (purchased("click25")) clickBonus *= 1.25;
  if (purchased("click100")) clickBonus *= 3;
  if (purchased("gold25")) goldenTouch *= 1.25;
}

function updateDisplay() {
  // The cent symbol is visual only; count remains numeric for calculations.
  display.textContent = `${formatNumber(count)}¢`;
}

function saveGame() {
  // Save only the durable state. Derived stats are recalculated when the page loads.
  localStorage.setItem("clickCount", count);
  localStorage.setItem("upgradeState", JSON.stringify({ levels, milestones: milestonePurchases }));
}

function updateUpgradeButtons() {
  // Re-render every upgrade after clicks, purchases, and passive income changes the balance.
  upgradeSlots.forEach((slot) => {
    const key = slot.dataset.upgrade;
    const upgrade = upgrades[key];
    const level = levels[key] || 0;
    const cost = getCost(upgrade, level);
    const affordableAmount = getAffordableAmount(upgrade, level, purchaseAmount);
    const batchCost = getBatchCost(upgrade, level, affordableAmount);
    const isMaxed = upgrade.max && level >= upgrade.max;
    const isSingleUse = !upgrade.repeatable && level > 0;

    // The displayed price is the total for the selected batch, not just the next level.
    slot.textContent = isMaxed || isSingleUse
      ? `${upgrade.name} - MAXED`
      : `${upgrade.name} Lv.${level + 1}${affordableAmount > 1 ? `-${level + affordableAmount}` : ""} - ${formatNumber(purchaseAmount === "max" ? batchCost || cost : batchCost || cost)}¢`;
    slot.disabled = Boolean(isMaxed || isSingleUse || affordableAmount === 0 || count < cost);
    slot.setAttribute("aria-label", slot.textContent);
  });
  status.textContent = `${formatNumber(totalCps)} CPS | +${formatNumber(clickBonus)} per click | x${multiplier}`;
  renderMilestones();
}

function hasMilestone(effect) {
  return Object.values(milestonePurchases).some((effects) => effects.includes(effect));
}

function getNextMilestone(key) {
  const purchased = milestonePurchases[key] || [];
  return milestoneData[key].find((milestone) => !purchased.includes(milestone.effect));
}

function renderMilestones() {
  milestoneGrid.replaceChildren();
  mainMilestoneKeys.forEach((key) => {
    const next = getNextMilestone(key);
    const level = levels[key] || 0;
    if (!next || level < next.level) return;
    const card = document.createElement("button");
    card.className = "milestone-card";
    card.disabled = count < next.cost;
    card.dataset.upgrade = key;
    card.textContent = `${upgrades[key].name} ${next.level}\n${next.name}\n${next.text}\n${formatNumber(next.cost)}¢`;
    card.setAttribute("aria-label", card.textContent.replaceAll("\n", " "));
    milestoneGrid.appendChild(card);
  });

  const allPurchased = mainMilestoneKeys.every((key) => !getNextMilestone(key));
  finalUpgrade.hidden = !allPurchased || hasMilestone("final");
  finalUpgrade.textContent = "THE LAST COIN - Unlock the Endgame Coin";
}

function spawnFallingCoin() {
  // Each background coin gets random CSS values for variety in size, speed, and drift.
  const coin = document.createElement("span");
  const size = 28 + Math.random() * 42;
  const fallDuration = 7 + Math.random() * 7;
  const drift = -15 + Math.random() * 30;

  coin.className = "falling-coin";
  coin.style.left = `${Math.random() * 100}%`;
  coin.style.setProperty("--coin-size", `${size}px`);
  coin.style.setProperty("--fall-duration", `${fallDuration}s`);
  coin.style.setProperty("--drift", `${drift}vw`);
  // Removing finished elements prevents repeated clicks from building up unused DOM nodes.
  coin.addEventListener("animationend", () => coin.remove());
  fallingCoins.appendChild(coin);
}


calculateStats();
updateDisplay();
updateUpgradeButtons();
if (hasMilestone("final")) {
  document.body.classList.add("final-coin");
}

purchaseOptions.forEach((option) => {
  option.addEventListener("click", () => {
    purchaseAmount = option.dataset.amount === "max"
      ? "max"
      : Number.parseInt(option.dataset.amount, 10);
    purchaseOptions.forEach((purchaseOption) => {
      purchaseOption.classList.toggle("active", purchaseOption === option);
    });
    updateUpgradeButtons();
  });
});

btn.addEventListener("click", () => {
  // The decorative animation and the gameplay reward are triggered by the same click.
  spawnFallingCoin();
  btn.classList.remove("coin-clicked");
  void btn.offsetWidth;
  btn.classList.add("coin-clicked");

  // Manual click value includes flat bonuses and a percentage of current CPS.
  let earned = 1 + clickBonus + (totalCps * goldenTouch);
  if (Math.random() < critChance) {
    earned *= 10;
  }
  count += Math.floor(earned * multiplier * (hasMilestone("click100") ? 3 : 1) * (hasMilestone("gold100") ? 25 : 1));
  updateDisplay();
  saveGame();
  updateUpgradeButtons();
});

upgradeSlots.forEach((slot) => {
  slot.addEventListener("click", () => {
    const key = slot.dataset.upgrade;
    const upgrade = upgrades[key];
    const level = levels[key] || 0;
    const amount = getAffordableAmount(upgrade, level, purchaseAmount);
    const cost = getBatchCost(upgrade, level, amount);

    // Recheck affordability at click time because the displayed price may be stale by a moment.
    if (amount === 0 || count < cost || (upgrade.max && level >= upgrade.max) || (!upgrade.repeatable && level > 0)) {
      return;
    }

    count -= cost;
    levels[key] = level + amount;
    if (upgrade.timeWarp && amount > 0) {
      count += Math.floor(totalCps * 300 * multiplier);
    }
    calculateStats();
    updateDisplay();
    saveGame();
    updateUpgradeButtons();
  });

  milestoneGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".milestone-card");
    if (!card) return;
    const key = card.dataset.upgrade;
    const milestone = getNextMilestone(key);
    if (!milestone || (levels[key] || 0) < milestone.level || count < milestone.cost) return;
    count -= milestone.cost;
    milestonePurchases[key] = [...(milestonePurchases[key] || []), milestone.effect];
    calculateStats();
    if (milestone.effect === "mintEvent") {
      showEvent("Festival Mint unlocked: a rich mint event will appear soon!");
    }
    updateDisplay();
    saveGame();
    updateUpgradeButtons();
  });

  finalUpgrade.addEventListener("click", () => {
    if (hasMilestone("final")) return;
    milestonePurchases.final = ["final"];
    document.body.classList.add("final-coin");
    showEvent("THE END OF CONTENT: your coin has become the Celestial Coin!");
    saveGame();
    renderMilestones();
  });
});

setInterval(() => {
  // Passive generators pay once per second. A visible magnet bonus doubles this payout temporarily.
  if (totalCps === 0) {
    return;
  }

  const bonusMultiplier = Date.now() < bonusActiveUntil ? 2 : 1;
  count += Math.floor(totalCps * bonusMultiplier * multiplier);
  updateDisplay();
  saveGame();
  updateUpgradeButtons();
}, 1000);

setInterval(() => {
  // Interest pays once per minute and is capped so saved coins cannot grow without limit.
  if (levels.interest) {
    count += Math.min(Math.floor(count * 0.01), 10000);
    updateDisplay();
    saveGame();
    updateUpgradeButtons();
  }
}, 60000);

function scheduleBonusCoin() {
  // Later milestones shorten the event timer without making events constant.
  const delay = hasMilestone("eventRate") ? 15000 + Math.random() * 15000 : 30000 + Math.random() * 30000;
  bonusEventTimer = setTimeout(() => {
    bonusCoin.hidden = false;
    if (hasMilestone("mintEvent") && Math.random() < 0.35) {
      bonusCoin.dataset.event = "mint";
      showEvent("Mint Frenzy! Choose the coin before it vanishes.");
    }
  }, delay);
}

bonusCoin.addEventListener("click", () => {
  if (bonusCoin.dataset.wave === "true") {
    collectWaveCoin();
    return;
  }
  if (hasMilestone("pouches")) {
    delete bonusCoin.dataset.event;
    showPouches();
    return;
  }
  bonusCoin.hidden = true;
  if (bonusCoin.dataset.event === "mint") {
    count += Math.floor(Math.max(count * 0.1, totalCps * 60) * (hasMilestone("event100") ? 10 : 1));
    delete bonusCoin.dataset.event;
    showEvent("The mint explodes with coins!");
  } else if (levels.magnet) {
    bonusActiveUntil = Date.now() + 15000;
  } else {
    count += Math.floor(scaleEventReward(100) * multiplier);
    updateDisplay();
    saveGame();
  }
  if (hasMilestone("wave")) startGoldenWave();
  scheduleBonusCoin();
});

setInterval(() => {
  // The magnet automatically collects the bonus only after it has appeared on screen.
  if (!bonusCoin.hidden && levels.magnet) {
    bonusCoin.click();
  }
}, 1000);

scheduleBonusCoin();

function scaleEventReward(base) {
  const scaled = Math.max(base, Math.floor(count * 0.01));
  return scaled * (hasMilestone("event100") ? 10 : 1) * (hasMilestone("gold100") ? 25 : 1);
}

function showEvent(message) {
  eventMessage.textContent = message;
  eventMessage.hidden = false;
  window.clearTimeout(showEvent.timeout);
  showEvent.timeout = window.setTimeout(() => {
    eventMessage.hidden = true;
  }, 3500);
}

function showPouches() {
  bonusCoin.hidden = true;
  eventMessage.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = "Choose a money pouch";
  eventMessage.appendChild(title);
  const options = [
    { label: "Treasure", reward: scaleEventReward(300) },
    { label: "Multiplier", multiplier: randomMultiplier() },
    { label: "Empty / curse", reward: Math.random() < 0.5 ? 0 : -Math.floor(count * 0.25) }
  ];
  options.forEach((option) => {
    const pouch = document.createElement("button");
    pouch.textContent = option.label;
    pouch.className = "purchase-option";
    pouch.addEventListener("click", () => {
      if (option.multiplier) {
        const duration = 8000 + Math.random() * 22000;
        multiplier = option.multiplier;
        window.setTimeout(() => calculateStats(), duration);
        showEvent(`${option.multiplier.toFixed(2)}x multiplier for ${Math.ceil(duration / 1000)} seconds!`);
      } else {
        count = Math.max(0, count + option.reward);
        showEvent(option.reward > 0 ? `The pouch granted ${formatNumber(option.reward)}¢!` : "The pouch was cursed!");
      }
      updateDisplay();
      saveGame();
      updateUpgradeButtons();
      if (hasMilestone("wave")) startGoldenWave();
      scheduleBonusCoin();
    });
    eventMessage.appendChild(pouch);
  });
  eventMessage.hidden = false;
}

function randomMultiplier() {
  return 0.75 + Math.random() * 3.25;
}

function startGoldenWave() {
  if (waveCoins > 0) return;
  waveCoins = 4 + Math.floor(Math.random() * 5);
  waveReward = 1;
  bonusCoin.dataset.wave = "true";
  bonusCoin.classList.add("wave-coin");
  showEvent(`Golden wave: ${waveCoins} coins are coming!`);
  spawnNextWaveCoin();
}

function spawnNextWaveCoin() {
  if (waveCoins <= 0) {
    bonusCoin.hidden = true;
    delete bonusCoin.dataset.wave;
    bonusCoin.classList.remove("wave-coin");
    return;
  }
  bonusCoin.hidden = false;
  bonusCoin.style.left = `${10 + Math.random() * 75}%`;
  bonusCoin.style.bottom = `${10 + Math.random() * 70}%`;
  window.clearTimeout(spawnNextWaveCoin.timeout);
  spawnNextWaveCoin.timeout = window.setTimeout(() => {
    waveCoins = 0;
    spawnNextWaveCoin();
  }, hasMilestone("goldTime") ? 4500 : 3000);
}

function collectWaveCoin() {
  count += Math.floor(scaleEventReward(100) * waveReward * multiplier);
  waveReward *= 1.35;
  waveCoins--;
  updateDisplay();
  saveGame();
  spawnNextWaveCoin();
}
