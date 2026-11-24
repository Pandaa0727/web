(() => {
  const COLS = 10;
  const ROWS = 20;
  const SIZE = 18;

  const COLORS = {
    I: "#4db6c8",
    O: "#e0b84d",
    T: "#9b6bd6",
    S: "#62b86b",
    Z: "#d96b6b",
    J: "#5b7fd6",
    L: "#d98a45",
  };

  const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  };

  const TYPES = Object.keys(SHAPES);

  const canvas = document.querySelector("#tetris-canvas");
  const nextCanvas = document.querySelector("#tetris-next");
  const scoreEl = document.querySelector("#tetris-score");
  const startBtn = document.querySelector("#tetris-start");
  const toggleBtn = document.querySelector("#tetris-toggle");
  const widget = document.querySelector("#tetris");
  const ctx = canvas.getContext("2d");
  const nextCtx = nextCanvas.getContext("2d");

  let board = createBoard();
  let piece = null;
  let nextType = randomType();
  let score = 0;
  let dropMs = 700;
  let lastDrop = 0;
  let running = false;
  let over = false;
  let raf = 0;

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function randomType() {
    return TYPES[Math.floor(Math.random() * TYPES.length)];
  }

  function rotate(matrix) {
    const n = matrix.length;
    const next = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        next[x][n - 1 - y] = matrix[y][x];
      }
    }
    return next;
  }

  function spawn() {
    const type = nextType;
    nextType = randomType();
    const matrix = SHAPES[type].map((row) => row.slice());
    piece = {
      type,
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: 0,
    };
    drawNext();
    if (collides(piece.x, piece.y, piece.matrix)) {
      running = false;
      over = true;
      startBtn.textContent = "重来";
      draw();
      return false;
    }
    return true;
  }

  function collides(x, y, matrix) {
    for (let row = 0; row < matrix.length; row += 1) {
      for (let col = 0; col < matrix[row].length; col += 1) {
        if (!matrix[row][col]) continue;
        const nx = x + col;
        const ny = y + row;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function merge() {
    piece.matrix.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!cell) return;
        const by = piece.y + y;
        const bx = piece.x + x;
        if (by >= 0) board[by][bx] = piece.type;
      });
    });
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y -= 1) {
      if (board[y].every(Boolean)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        cleared += 1;
        y += 1;
      }
    }
    if (cleared) {
      score += [0, 100, 300, 500, 800][cleared];
      scoreEl.textContent = String(score);
      dropMs = Math.max(180, 700 - Math.floor(score / 500) * 40);
    }
  }

  function hardDrop() {
    if (!piece || !running) return;
    while (!collides(piece.x, piece.y + 1, piece.matrix)) piece.y += 1;
    lockPiece();
  }

  function lockPiece() {
    merge();
    clearLines();
    spawn();
  }

  function move(dx, dy) {
    if (!piece || !running) return false;
    if (!collides(piece.x + dx, piece.y + dy, piece.matrix)) {
      piece.x += dx;
      piece.y += dy;
      draw();
      return true;
    }
    return false;
  }

  function turn() {
    if (!piece || !running) return;
    const next = rotate(piece.matrix);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collides(piece.x + kick, piece.y, next)) {
        piece.matrix = next;
        piece.x += kick;
        draw();
        return;
      }
    }
  }

  function cell(c, x, y, size, context) {
    const pad = 1;
    context.fillStyle = COLORS[c];
    context.fillRect(x * size + pad, y * size + pad, size - pad * 2, size - pad * 2);
  }

  function drawBoard(context, width, height, cellSize) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#16120f";
    context.fillRect(0, 0, width, height);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (board[y][x]) cell(board[y][x], x, y, cellSize, context);
      }
    }
  }

  function draw() {
    drawBoard(ctx, canvas.width, canvas.height, SIZE);
    if (piece) {
      piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) cell(piece.type, piece.x + x, piece.y + y, SIZE, ctx);
        });
      });
    }
    if (over) {
      ctx.fillStyle = "rgba(22, 18, 15, 0.72)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f7f1e8";
      ctx.font = "600 16px Avenir Next, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("游戏结束", canvas.width / 2, canvas.height / 2);
    }
  }

  function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.fillStyle = "#16120f";
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const matrix = SHAPES[nextType];
    const size = 14;
    const offsetX = (nextCanvas.width / size - matrix[0].length) / 2;
    const offsetY = (nextCanvas.height / size - matrix.length) / 2;
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        nextCtx.fillStyle = COLORS[nextType];
        nextCtx.fillRect((offsetX + x) * size + 1, (offsetY + y) * size + 1, size - 2, size - 2);
      });
    });
  }

  function loop(time) {
    if (!running) return;
    if (time - lastDrop >= dropMs) {
      if (!move(0, 1)) lockPiece();
      lastDrop = time;
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    board = createBoard();
    score = 0;
    dropMs = 700;
    over = false;
    scoreEl.textContent = "0";
    nextType = randomType();
    spawn();
    running = true;
    startBtn.textContent = "重来";
    cancelAnimationFrame(raf);
    lastDrop = performance.now();
    raf = requestAnimationFrame(loop);
    draw();
  }

  function action(name) {
    if (name === "left") move(-1, 0);
    else if (name === "right") move(1, 0);
    else if (name === "down") {
      if (!move(0, 1)) lockPiece();
    } else if (name === "rot") turn();
    else if (name === "drop") hardDrop();
  }

  startBtn.addEventListener("click", start);

  toggleBtn.addEventListener("click", () => {
    const collapsed = widget.classList.toggle("is-collapsed");
    toggleBtn.textContent = collapsed ? "展开" : "收起";
    toggleBtn.setAttribute("aria-pressed", String(!collapsed));
  });

  widget.querySelector(".tetris-pad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tetris]");
    if (!button) return;
    action(button.dataset.tetris);
  });

  document.addEventListener("keydown", (event) => {
    if (!running || widget.classList.contains("is-collapsed")) return;
    const keys = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowDown: "down",
      ArrowUp: "rot",
      " ": "drop",
    };
    const name = keys[event.key];
    if (!name) return;
    event.preventDefault();
    action(name);
  });

  draw();
  drawNext();
})();
