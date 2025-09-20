import Constants from "../core/Constants.js";
import MazeData from "../maze/MazeData.js";

const { DIRECTIONS } = MazeData;

class MinimapRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.maze = null;
    this.fog = null;
    this.cellSize = 8;
  }

  setMaze(mazeData, fogOfWar) {
    this.maze = mazeData;
    this.fog = fogOfWar;
    if (!mazeData) {
      return;
    }
    const scale = Math.min(
      this.canvas.width / mazeData.width,
      this.canvas.height / mazeData.height
    );
    this.cellSize = Math.max(2, Math.floor(scale));
  }

  render(camera, debugFlags) {
    if (!this.maze || !this.fog) {
      return;
    }
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.fillStyle = "rgba(10, 10, 10, 0.92)";
    ctx.fillRect(0, 0, width, height);

    const cellSize = this.cellSize;
    const exploredColor = "rgba(0, 64, 96, 0.55)";
    const visibleColor = "rgba(0, 255, 255, 0.18)";

    for (let y = 0; y < this.maze.height; y += 1) {
      for (let x = 0; x < this.maze.width; x += 1) {
        if (!this.fog.isExplored(x, y)) {
          continue;
        }
        const baseX = Math.floor(x * cellSize);
        const baseY = Math.floor(y * cellSize);
        ctx.fillStyle = this.fog.isVisible(x, y) ? visibleColor : exploredColor;
        ctx.fillRect(baseX, baseY, cellSize, cellSize);
      }
    }

    const wallStroke = Math.max(1, cellSize * 0.25);
    ctx.strokeStyle = Constants.COLORS.WALL_NEAR;
    ctx.lineWidth = wallStroke;
    ctx.lineCap = "round";
    ctx.beginPath();

    for (let y = 0; y < this.maze.height; y += 1) {
      for (let x = 0; x < this.maze.width; x += 1) {
        if (!this.fog.isExplored(x, y)) {
          continue;
        }
        const baseX = Math.floor(x * cellSize);
        const baseY = Math.floor(y * cellSize);
        const rightX = baseX + cellSize;
        const bottomY = baseY + cellSize;

        if (this.maze.hasWall(x, y, DIRECTIONS.NORTH)) {
          ctx.moveTo(baseX, baseY);
          ctx.lineTo(rightX, baseY);
        }
        if (this.maze.hasWall(x, y, DIRECTIONS.WEST)) {
          ctx.moveTo(baseX, baseY);
          ctx.lineTo(baseX, bottomY);
        }
        if (x === this.maze.width - 1 && this.maze.hasWall(x, y, DIRECTIONS.EAST)) {
          ctx.moveTo(rightX, baseY);
          ctx.lineTo(rightX, bottomY);
        }
        if (y === this.maze.height - 1 && this.maze.hasWall(x, y, DIRECTIONS.SOUTH)) {
          ctx.moveTo(baseX, bottomY);
          ctx.lineTo(rightX, bottomY);
        }
      }
    }

    ctx.stroke();

    if (debugFlags.showGrid) {
      ctx.strokeStyle = "rgba(0, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= this.maze.width; x += 1) {
        ctx.moveTo(x * cellSize + 0.5, 0);
        ctx.lineTo(x * cellSize + 0.5, this.maze.height * cellSize);
      }
      for (let y = 0; y <= this.maze.height; y += 1) {
        ctx.moveTo(0, y * cellSize + 0.5);
        ctx.lineTo(this.maze.width * cellSize, y * cellSize + 0.5);
      }
      ctx.stroke();
    }

    const playerX = camera.position.x * cellSize;
    const playerY = camera.position.y * cellSize;
    ctx.fillStyle = Constants.COLORS.PLAYER;
    ctx.beginPath();
    ctx.arc(playerX, playerY, Math.max(3, cellSize * 0.35), 0, Math.PI * 2);
    ctx.fill();

    const dirLength = Math.max(10, cellSize * 2.2);
    ctx.strokeStyle = Constants.COLORS.PLAYER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerX, playerY);
    ctx.lineTo(
      playerX + Math.cos(camera.angle) * dirLength,
      playerY + Math.sin(camera.angle) * dirLength
    );
    ctx.stroke();
  }
}

export default MinimapRenderer;
