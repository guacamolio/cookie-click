<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coin Clicker</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="falling-coins"></div>

  <div class="game-area">
    <div class="clicker-area">
      <div class="score-container">
        <div id="punktuskaits">0¢</div>
        <div id="cps-display">0 CPS | +1/click</div>
      </div>

      <button id="main-coin" class="coin tier-0" aria-label="Click Coin"></button>
    </div>

    <div class="upgrades-panel">
      <div class="panel-heading">
        <h1>UPGRADES</h1>
        <button id="achievements-btn" class="icon-btn" title="View achievements" aria-label="View achievements">🏆</button>
      </div>

      <div class="purchase-options">
        <button class="purchase-option active" data-amount="1">1x</button>
        <button class="purchase-option" data-amount="10">10x</button>
        <button class="purchase-option" data-amount="100">100x</button>
        <button class="purchase-option" data-amount="max">MAX</button>
      </div>

      <div class="upgrade-list" id="upgrade-list"></div>
    </div>
  </div>

  <button id="settings-btn" title="Settings">⚙️</button>

  <div id="settings-modal" class="modal hidden">
    <div class="modal-content">
      <h2>Settings</h2>
      <div class="setting-row">
        <label for="sound-toggle">Sound Effects:</label>
        <input type="checkbox" id="sound-toggle" checked>
      </div>
      <div class="setting-row">
        <button id="save-btn" class="action-btn">Save Game (PHP)</button>
        <button id="load-btn" class="action-btn">Load Game (PHP)</button>
      </div>
      <p id="save-status" role="status" aria-live="polite"></p>
      <button id="close-settings" class="close-btn">Close</button>
    </div>
  </div>

  <div id="pouch-modal" class="modal hidden">
    <div class="modal-content pouch-content">
      <h2>Pick a Money Pouch!</h2>
      <p>Choose one pouch to claim your mystery reward!</p>
      <div class="pouches-container">
        <div class="pouch" data-pouch="0">💰</div>
        <div class="pouch" data-pouch="1">💰</div>
        <div class="pouch" data-pouch="2">💰</div>
      </div>
    </div>
  </div>

  <div id="achievements-modal" class="modal hidden">
    <div class="modal-content achievements-content">
      <h2>Achievements</h2>
      <p id="achievement-progress" class="achievement-progress"></p>
      <div id="achievement-list" class="achievement-list"></div>
      <button id="close-achievements" class="close-btn">Close</button>
    </div>
  </div>

  <script src="js/game.js"></script>
</body>
</html>
