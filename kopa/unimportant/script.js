const btn = document.querySelector(".icon-btn");
const display = document.getElementById("punktuskaits");
const message = document.getElementById("message");

let count = parseInt(localStorage.getItem("clickCount")) || 0;

const upgrades = [
  {
    name: "multiplier",
    cost: parseInt(localStorage.getItem("multiplier_cost")) || 10,
    level: parseInt(localStorage.getItem("multiplier_level")) || 1,
    el: document.querySelector(".buy-multiplier-btn"),
    costDisplay: document.getElementById("multiplier-cost-display"),
    levelDisplay: document.getElementById("multiplier-display")
  },
  {
    name: "auto_clicker",
    cost: parseInt(localStorage.getItem("auto_clicker_cost")) || 50,
    level: parseInt(localStorage.getItem("auto_clicker_count")) || 0,
    el: document.querySelector(".but_auto_clicker-btn"),
    costDisplay: document.getElementById("auto_clicker-cost-display"),
    levelDisplay: document.getElementById("auto_clicker-display")
  }  
];


function saveGame() {
  localStorage.setItem("clickCount", count);
  upgrades.forEach(upg => {
    localStorage.setItem(`${upg.name}_level`, upg.level);
    localStorage.setItem(`${upg.name}_cost`, upg.cost)    
  });
}

function updateDisplay() {
  display.textContent = count;
  upgrades.forEach(upg => {
    if (upg.levelDisplay) upg.levelDisplay.textContent = upg.level;
    if (upg.costDisplay) upg.costDisplay.textContent = upg.cost;
  });
}

function buyUpgrade(upg) {
  if (count >= upg.cost) {
    count -= upg.cost;
    upg.level++;
    upg.cost = Math.floor(upg.cost * 1.5); 
    message.textContent = "";
    saveGame();
    updateDisplay();
  } 
}


btn.addEventListener("click", () => {
  const multiplier = upgrades.find(u => u.name === "multiplier").level;
  count += multiplier;
  
  saveGame();
  updateDisplay();
});

btn.addEventListener("click", () => {
  const auto_clicker = upgrades.find(u => u.name === "auto_clicker").level;
  count += auto_clicker;
  
  saveGame();
  updateDisplay();
});

upgrades.forEach(upg => {
  upg.el.addEventListener("click", () => buyUpgrade(upg));
  updateDisplay();
});

