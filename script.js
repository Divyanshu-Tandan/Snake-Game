const board = document.querySelector(".board");
const startBtn = document.querySelector(".btn-start");
const resetBtn = document.querySelector(".btn-reset");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");
const pauseGameModal = document.querySelector(".pause-game");
const blockHeight = 50;
const blockWidth = 50;
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
const blocks = [];
const snake = [
  {
    x: 1,
    y: 5,
  },
];

let direction = "right";
let intervalId = null;
let timerIntervalId = null;
let pause = false;
const wallsBtn = document.querySelector('.btn-walls');

wallsBtn.addEventListener('click', () => {
    wallsEnabled = !wallsEnabled;
    wallsBtn.innerText = `Walls: ${wallsEnabled ? "ON" : "OFF"}`;
    board.style.border = wallsEnabled ? "2px solid black" : "2px dashed gray";
});

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

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

function drawSnake() {
  if (pause) return;
  blocks[`${food.x}-${food.y}`].classList.add("food");
  let head = { x: snake[0].x, y: snake[0].y };

  // Move head one step depending on direction
  if (direction === "left") head.y--;
  else if (direction === "right") head.y++;
  else if (direction === "up") head.x--;
  else if (direction === "down") head.x++;

  // Walls Mode ON
  if (wallsEnabled) {
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
      gameOver.play();
      gameOverModal.style.display = "flex";
      modal.style.display = "flex";
      clearInterval(intervalId);
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

  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    gameOver.play();
    gameOverModal.style.display = "flex";
    modal.style.display = "flex";
    clearInterval(intervalId);
  }

  if (head.x === food.x && head.y === food.y) {
    foodConsumed.currentTime = 0; // reset
    foodConsumed.play();
    console.log("Food");
    blocks[`${food.x}-${food.y}`].classList.remove("food");
    food = getRandomFoodPosition(snake, rows, cols);
    score += 10;
    if (score <= 50 && score >= 10) {
      speed = 350;
    } else if (score >= 60 && score <= 120) {
      speed = 200;
    } else if (score >= 130 && score <= 200) {
      speed = 150;
    } else if (score >= 210 && score <= 350) {
      speed = 130;
    } else if (score >= 400 && score < 600) {
      speed = 100;
    } else if (score >= 600) {
      speed = 80;
    }
    if (score >= highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore.toString());
      highScoreElement.innerText = `${highScore}`;
    }
    scoreDisplay.forEach((node) => (node.innerText = `${score}`));
    snake.unshift(head);

    // --- RESTART INTERVAL AFTER SPEED CHANGE ---
    clearInterval(intervalId);
    intervalId = setInterval(drawSnake, speed);
  }

  for (const segment of snake) {
    const snakeBlock = blocks[`${segment.x}-${segment.y}`];
    snakeBlock.classList.remove("snake");
    snakeBlock.classList.remove("head");
  }
  snake.unshift(head);
  snake.pop();
  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];
    const snakeBlock = blocks[`${segment.x}-${segment.y}`];
    if (i === 0) {
      // Head - darker green
      snakeBlock.classList.add("head");
    } else {
      // Body - bright green
      snakeBlock.classList.add("snake");
    }
  }
}

addEventListener("keydown", (event) => {
  if (event.key == "ArrowLeft" && direction != "right") {
    direction = "left";
  } else if (event.key == "ArrowRight" && direction != "left") {
    direction = "right";
  } else if (event.key == "ArrowUp" && direction != "down") {
    direction = "up";
  } else if (event.key == "ArrowDown" && direction != "up") {
    direction = "down";
  } else if (
    event.key === " " &&
    time != `00:00` &&
    gameOverModal.style.display != "flex"
  ) {
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

startBtn.addEventListener("click", () => {
  modal.style.display = "none";
  startGameModal.style.display = "none";
  timerIntervalId = setInterval(() => {
    if (pause) return;
    let [mins, secs] = time.split(":").map(Number);
    secs += 1;
    if (secs === 59) {
      mins += 1;
      secs = 0;
    }
    mins = mins < 10 ? `0${mins}` : `${mins}`;
    secs = secs < 10 ? `0${secs}` : `${secs}`;
    time = `${mins}:${secs}`;
    timerElement.innerText = `${time}`;
  }, 1000);
  intervalId = setInterval(() => {
    drawSnake();
  }, speed);
});

resetBtn.addEventListener("click", () => {
  for (const segment of snake) {
    const snakeBlock = blocks[`${segment.x}-${segment.y}`];
    snakeBlock.classList.remove("snake");
    snakeBlock.classList.remove("head");
  }
  blocks[`${food.x}-${food.y}`].classList.remove("food");
  food = {
    x: Math.floor(Math.random() * rows),
    y: Math.floor(Math.random() * cols),
  };
  snake.length = 0;
  snake.push({ x: 1, y: 5 });
  direction = "right";
  score = 0;
  speed = 400;
  scoreDisplay.forEach((node) => (node.innerText = `${score}`));
  highScoreElement.innerText = `${localStorage.getItem("highScore")}`;
  time = `00:00`;
  modal.style.display = "none";
  gameOverModal.style.display = "none";
  intervalId = setInterval(() => {
    drawSnake();
  }, speed);
});
