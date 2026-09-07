// Cache the main UI elements once so event handlers and timers can update them efficiently.
const btn = document.querySelector(".coin");
const display = document.getElementById("punktuskaits");
const status = document.getElementById("game-status");
const upgradeSlots = document.querySelectorAll(".upgrade-slot");
const purchaseOptions = document.querySelectorAll(".purchase-option");
const bonusCoin = document.getElementById("bonus-coin");
const fallingCoins = document.getElementById("falling-coins");

// Progress is stored as plain numbers in localStorage. Missing or invalid values start at zero.
let count = Number.parseInt(localStorage.getItem("clickCount"), 10) || 0;
const savedState = JSON.parse(localStorage.getItem("upgradeState") || "{}");
const levels = savedState.levels || {};

// These are derived statistics. They are recalculated whenever an upgrade changes level.
let totalCps = 0;
let clickBonus = 0;
let goldenTouch = 0;
let critChance = 0;
let multiplier = 1;
let bonusActiveUntil = 0;
// The selected batch size applies to repeatable upgrades: 1, 10, 100, or every affordable level.
let purchaseAmount = 1;

// Upgrade data is kept in one table so button rendering and purchase logic use the same values.
// Repeatable upgrades use the exponential cost formula: base cost * 1.15^current level.
const upgrades = {
  piggy: { name: "Piggy Bank", baseCost: 10, cps: 1, repeatable: true },
  copper: { name: "Polished Copper", baseCost: 25, click: 1, repeatable: true },
  minting: { name: "Heavy Minting", baseCost: 100, click: 5, repeatable: true },
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
}

function updateDisplay() {
  // The cent symbol is visual only; count remains numeric for calculations.
  display.textContent = `${formatNumber(count)}¢`;
}

function saveGame() {
  // Save only the durable state. Derived stats are recalculated when the page loads.
  localStorage.setItem("clickCount", count);
  localStorage.setItem("upgradeState", JSON.stringify({ levels }));
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
  count += Math.floor(earned * multiplier);
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
  // Schedule the next bonus independently so the delay is a fresh random 30-60 seconds each time.
  const delay = 30000 + Math.random() * 30000;
  setTimeout(() => {
    bonusCoin.hidden = false;
  }, delay);
}

bonusCoin.addEventListener("click", () => {
  // Coin Magnet turns collection into a temporary CPS boost; otherwise the coin grants a flat reward.
  bonusCoin.hidden = true;
  if (levels.magnet) {
    bonusActiveUntil = Date.now() + 15000;
  } else {
    count += Math.floor(100 * multiplier);
    updateDisplay();
    saveGame();
  }
  scheduleBonusCoin();
});

setInterval(() => {
  // The magnet automatically collects the bonus only after it has appeared on screen.
  if (!bonusCoin.hidden && levels.magnet) {
    bonusCoin.click();
  }
}, 1000);

scheduleBonusCoin();