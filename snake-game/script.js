// DOM
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("scoreText");
const restartBtn = document.getElementById("restartBtn");
const musicToggleBtn = document.getElementById("musicToggle");
const musicVolume = document.getElementById("musicVolume");
const wrapStateEl = document.getElementById("wrapState");

// Sonidos
const eatSound = new Audio("sounds/eat.wav");
const gameOverSound = new Audio("sounds/gameover.wav");
const music = new Audio("sounds/music.mp3");
music.loop = true;
music.volume = parseFloat(musicVolume?.value || "0.35");
let musicEnabled = true; // estado del botón

// Configuración
const box = 20;
const cols = canvas.width / box;
const rows = canvas.height / box;
let wrapWalls = true; // true = teletransporte, false = morir al chocar

// Variables de juego
let snake, direction, nextDirection, food, score, gameOver, gameInterval, speedMs;
let initialSpeed = 150; // se ajusta al elegir dificultad

// ====== Menú / Inicio ======
function startGame(speed) {
  initialSpeed = speed;

  // Mostrar elementos de juego
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";
  document.querySelector(".hud").style.display = "flex";

  // Intentar iniciar música (el click del botón habilita autoplay)
  if (musicEnabled) {
    startMusicSafe();
  }

  initGame();
}

// Autoplay safe-start (evita errores si el navegador bloquea)
function startMusicSafe() {
  music.play().catch(() => {
    // Si falla (auto-play bloqueado), cambiamos el botón a OFF visualmente
    musicEnabled = false;
    updateMusicButton();
  });
}

// ====== Controles UI música ======
musicToggleBtn?.addEventListener("click", () => {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    startMusicSafe();
  } else {
    music.pause();
  }
  updateMusicButton();
});

musicVolume?.addEventListener("input", (e) => {
  music.volume = parseFloat(e.target.value);
});

function updateMusicButton() {
  musicToggleBtn.textContent = musicEnabled ? "🔊 Música: ON" : "🔈 Música: OFF";
}

// Pausar/continuar música al cambiar visibilidad de pestaña
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    music.pause();
  } else if (musicEnabled) {
    startMusicSafe();
  }
});

// ====== Controles del juego ======
document.addEventListener("keydown", (e) => {
  const k = e.key;

  if (gameOver && (k === "Enter" || k.toLowerCase() === "r")) {
    initGame();
    return;
  }

  if (k === "ArrowLeft"  && direction !== "RIGHT") nextDirection = "LEFT";
  if (k === "ArrowUp"    && direction !== "DOWN")  nextDirection = "UP";
  if (k === "ArrowRight" && direction !== "LEFT")  nextDirection = "RIGHT";
  if (k === "ArrowDown"  && direction !== "UP")    nextDirection = "DOWN";

  if (k.toLowerCase() === "w") {
    wrapWalls = !wrapWalls;
    wrapStateEl.textContent = wrapWalls ? "ON" : "OFF";
  }

  // Atajos de música
  if (k.toLowerCase() === "m") { // mute/unmute
    musicEnabled = !musicEnabled;
    if (musicEnabled) startMusicSafe(); else music.pause();
    updateMusicButton();
  }
});

restartBtn.addEventListener("click", initGame);

// ====== Lógica principal ======
function initGame() {
  snake = [{ x: 9 * box, y: 9 * box }];
  direction = "RIGHT";
  nextDirection = "RIGHT";
  food = spawnFood();
  score = 0;
  gameOver = false;
  speedMs = initialSpeed;
  updateScore();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, speedMs);
  draw();
}

function spawnFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * cols) * box,
      y: Math.floor(Math.random() * rows) * box,
    };
  } while (snake.some((p) => p.x === pos.x && p.y === pos.y));
  return pos;
}

function gameLoop() {
  if (gameOver) return;

  direction = nextDirection;
  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === "LEFT")  headX -= box;
  if (direction === "UP")    headY -= box;
  if (direction === "RIGHT") headX += box;
  if (direction === "DOWN")  headY += box;

  // Teletransporte si wrapWalls está activo
  if (wrapWalls) {
    if (headX < 0) headX = (cols - 1) * box;
    if (headX >= canvas.width) headX = 0;
    if (headY < 0) headY = (rows - 1) * box;
    if (headY >= canvas.height) headY = 0;
  }

  // Colisiones
  const hitWall = !wrapWalls && (headX < 0 || headY < 0 || headX >= canvas.width || headY >= canvas.height);
  const hitSelf = snake.some((p) => p.x === headX && p.y === headY);
  if (hitWall || hitSelf) {
    try { gameOverSound.currentTime = 0; gameOverSound.play(); } catch {}
    gameOver = true;
    clearInterval(gameInterval);
    draw();
    drawGameOver();
    return;
  }

  // Comer
  if (headX === food.x && headY === food.y) {
    try { eatSound.currentTime = 0; eatSound.play(); } catch {}
    snake.unshift({ x: headX, y: headY });
    score++;
    updateScore();
    food = spawnFood();
    increaseSpeed();
  } else {
    snake.unshift({ x: headX, y: headY });
    snake.pop();
  }

  draw();
}

function draw() {
  // Fondo con cuadrícula
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#333";
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      ctx.strokeRect(i * box, j * box, box, box);
    }
  }

  // Comida
  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, box, box);

  // Serpiente
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? "lime" : "#eee";
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  // Puntaje
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Puntuación: " + score, 10, 20);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("¡Game Over!", canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "16px Arial";
  ctx.fillText("Pulsa R/Enter para reiniciar", canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText(`Borde (W): ${wrapWalls ? "ON" : "OFF"}`, canvas.width / 2, canvas.height / 2 + 44);
  ctx.fillText("Música (M): ON/OFF", canvas.width / 2, canvas.height / 2 + 68);
  ctx.textAlign = "start";
}

function updateScore() {
  if (scoreText) scoreText.textContent = "Puntuación: " + score;
}

function increaseSpeed() {
  if (speedMs > 50) {
    speedMs -= 5;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, speedMs);
  }
}
