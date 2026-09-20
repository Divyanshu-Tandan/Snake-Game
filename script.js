const board = document.querySelector(".board");
const startBtn = document.querySelector(".btn-start");
const resetBtn = document.querySelector(".btn-reset");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");
const pauseGameModal = document.querySelector(".pause-game");

const settingsPanel = document.querySelector(".settings-panel");
const settingsOpenButtons = document.querySelectorAll(".btn-open-settings");
const settingsCloseButton = document.querySelector(".settings-close");
const settingsCloseBottomButton = document.querySelector(".settings-close-btn");

settingsOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    settingsPanel.style.display = "block";
  });
});

settingsCloseButton.addEventListener("click", () => {
  settingsPanel.style.display = "none";
});

settingsCloseBottomButton.addEventListener("click", () => {
  settingsPanel.style.display = "none";
});

const gameOver = new Audio("gameOver.mp3");
const foodConsumed = new Audio("foodConsumed.mp3");

let speed = 400;
let scoreDisplay = document.querySelectorAll(".score");
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
const highScoreElement = document.querySelector("#high-score");

let time = `00:00`;
const timerElement = document.querySelector("#timer");

highScoreElement.innerText = `${highScore}`;

let wallsEnabled = true; // toggle walls on/off
let soundEnabled = true; // toggle sound on/off

const blocks = [];

const rows = 20;
const cols = 20;

const snake = [
  {
    x: 1,
    y: 5,
  },
];

let direction = "right";
let nextDirection = "right";
let intervalId = null;
let timerIntervalId = null;
let pause = false;
const wallsBtn = document.querySelector(".btn-walls");
const soundBtn = document.querySelector(".btn-sound");
const themeSelector = document.querySelector(".theme-selector");
const snakeColorButtons = document.querySelectorAll(".snake-color");

// initialize theme from localStorage
const savedTheme = localStorage.getItem("theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);
if (themeSelector) themeSelector.value = savedTheme;

if (themeSelector) {
  themeSelector.addEventListener("change", (e) => {
    const t = e.target.value || "dark";
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  });
}

const savedSnakeColor =
  localStorage.getItem("snakeColor") || "green";

document.documentElement.setAttribute(
  "data-snake-color",
  savedSnakeColor
);

snakeColorButtons.forEach((button) => {
  button.classList.toggle(
    "active",
    button.dataset.color === savedSnakeColor
  );
});

snakeColorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedColor = button.dataset.color;

    document.documentElement.setAttribute(
      "data-snake-color",
      selectedColor
    );

    localStorage.setItem("snakeColor", selectedColor);

    snakeColorButtons.forEach((btn) => {
      btn.classList.toggle("active", btn === button);
    });
  });
});

wallsBtn.addEventListener("click", () => {
  wallsEnabled = !wallsEnabled;
  wallsBtn.innerText = `Walls: ${wallsEnabled ? "ON" : "OFF"}`;
  board.style.border = wallsEnabled ? "2px solid black" : "2px dashed gray";
});

soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundBtn.innerText = `${soundEnabled ? "🔊" : "🔇"} Sound: ${soundEnabled ? "ON" : "OFF"}`;
});

function getRandomFoodPosition(snake, rows, cols) {
  const occupied = new Set(snake.map((s) => `${s.x}-${s.y}`));
  const freeCells = [];

  for (let x = 0; x < rows; x++) {
    for (let y = 0; y < cols; y++) {
      if (!occupied.has(`${x}-${y}`)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  return freeCells[Math.floor(Math.random() * freeCells.length)];
}

let food = getRandomFoodPosition(snake, rows, cols);

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.appendChild(block);
    blocks[`${row}-${col}`] = block;
  }
}

function updateSpeed() {
  if (score >= 600) {
    speed = 80;
  } else if (score >= 400) {
    speed = 100;
  } else if (score >= 210) {
    speed = 130;
  } else if (score >= 130) {
    speed = 150;
  } else if (score >= 60) {
    speed = 200;
  } else if (score >= 10) {
    speed = 350;
  } else {
    speed = 400;
  }
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((value) => Math.round(value).toString(16).padStart(2, "0"))
      .join("")
  );
}

function getSnakeSegmentColor(index, length) {
  const styles = getComputedStyle(document.documentElement);

  const light = styles
    .getPropertyValue("--snake-light")
    .trim();

  const dark = styles
    .getPropertyValue("--snake-dark")
    .trim();

  const lightRgb = hexToRgb(light);
  const darkRgb = hexToRgb(dark);

  const progress = length <= 1 ? 0 : index / (length - 1);

  const r =
    lightRgb.r +
    (darkRgb.r - lightRgb.r) * progress;

  const g =
    lightRgb.g +
    (darkRgb.g - lightRgb.g) * progress;

  const b =
    lightRgb.b +
    (darkRgb.b - lightRgb.b) * progress;

  return rgbToHex(r, g, b);
}

function drawSnake() {
  if (pause) return;
  direction = nextDirection;
  let ateFood = false;
  if (food) {
    blocks[`${food.x}-${food.y}`].classList.add("food");
  }
  let head = { x: snake[0].x, y: snake[0].y };

  // Move head one step depending on direction
  if (direction === "left") head.y--;
  else if (direction === "right") head.y++;
  else if (direction === "up") head.x--;
  else if (direction === "down") head.x++;

  // Walls Mode ON
  if (wallsEnabled) {
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
      if (soundEnabled) gameOver.play();
      gameOverModal.style.display = "flex";
      modal.style.display = "flex";
      clearInterval(intervalId);
      clearInterval(timerIntervalId);
      return;
    }
  }
  // Wrap Around if walls disabled
  else {
    if (head.x < 0) head.x = rows - 1;
    else if (head.x >= rows) head.x = 0;

    if (head.y < 0) head.y = cols - 1;
    else if (head.y >= cols) head.y = 0;
  }

  ateFood = food && head.x === food.x && head.y === food.y;
  const bodyToCheck = ateFood ? snake : snake.slice(0, -1);

  if (bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y)) {
    if (soundEnabled) gameOver.play();
    gameOverModal.style.display = "flex";
    modal.style.display = "flex";
    clearInterval(intervalId);
    clearInterval(timerIntervalId);
    return;
  }

  if (ateFood) {
    if (soundEnabled) {
      foodConsumed.currentTime = 0; // reset
      foodConsumed.play();
    }
    if (food) {
      blocks[`${food.x}-${food.y}`].classList.remove("food");
    }
    score += 10;
    updateSpeed();
    if (score >= highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore.toString());
      highScoreElement.innerText = `${highScore}`;
    }
    scoreDisplay.forEach((node) => (node.innerText = `${score}`));

    // --- RESTART INTERVAL AFTER SPEED CHANGE ---
    startGameLoop();
  }

  for (const segment of snake) {
    const snakeBlock = blocks[`${segment.x}-${segment.y}`];

    snakeBlock.classList.remove("snake");
    snakeBlock.classList.remove("head");

    snakeBlock.style.removeProperty("--segment-color");
  }
  snake.unshift(head);

  if (!ateFood) {
    snake.pop();
  }
  if (ateFood) {
    food = getRandomFoodPosition(snake, rows, cols);
  }
  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];

    const snakeBlock =
      blocks[`${segment.x}-${segment.y}`];

    const segmentColor =
      getSnakeSegmentColor(i, snake.length);

    snakeBlock.style.setProperty(
      "--segment-color",
      segmentColor
    );

    if (i === 0) {
      snakeBlock.classList.add("head");
    } else {
      snakeBlock.classList.add("snake");
    }
  }
}

addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" && nextDirection !== "right") {
    nextDirection = "left";
  } else if (event.key === "ArrowRight" && nextDirection !== "left") {
    nextDirection = "right";
  } else if (event.key === "ArrowUp" && nextDirection !== "down") {
    nextDirection = "up";
  } else if (event.key === "ArrowDown" && nextDirection !== "up") {
    nextDirection = "down";
  } else if (
    event.key === " " &&
    time != `00:00` &&
    gameOverModal.style.display != "flex"
  ) {
    event.preventDefault();
    if (!pause) {
      pause = true;
      pauseGameModal.style.display = "flex";
      modal.style.display = "flex";
      scoreDisplay.forEach((node) => (node.innerText = `${score}`));
    } else {
      pause = false;
      pauseGameModal.style.display = "none";
      modal.style.display = "none";
    }
  }
});

function startTimer() {
  clearInterval(timerIntervalId);

  timerIntervalId = setInterval(() => {
    if (pause) return;

    let [mins, secs] = time.split(":").map(Number);

    secs += 1;

    if (secs === 60) {
      mins += 1;
      secs = 0;
    }

    mins = mins < 10 ? `0${mins}` : `${mins}`;
    secs = secs < 10 ? `0${secs}` : `${secs}`;

    time = `${mins}:${secs}`;
    timerElement.innerText = time;
  }, 1000);
}

function startGameLoop() {
  clearInterval(intervalId);

  intervalId = setInterval(drawSnake, speed);
}

startBtn.addEventListener("click", () => {
  modal.style.display = "none";
  startGameModal.style.display = "none";
  
  startTimer();
  startGameLoop();
});

resetBtn.addEventListener("click", () => {
  clearInterval(intervalId);
  clearInterval(timerIntervalId);

  for (const segment of snake) {
    const snakeBlock = blocks[`${segment.x}-${segment.y}`];
    snakeBlock.classList.remove("snake");
    snakeBlock.classList.remove("head");
  }

  if (food) {
    blocks[`${food.x}-${food.y}`].classList.remove("food");
  }

  snake.length = 0;
  snake.push({ x: 1, y: 5 });
  
  food = getRandomFoodPosition(snake, rows, cols);

  direction = "right";
  nextDirection = "right";
  score = 0;
  speed = 400;
  pause = false;

  scoreDisplay.forEach((node) => (node.innerText = `${score}`));

  highScoreElement.innerText = `${localStorage.getItem("highScore")}`;
  
  time = `00:00`;
  timerElement.innerText = "00:00";

  modal.style.display = "none";
  gameOverModal.style.display = "none";

  startTimer();
  startGameLoop();

});
