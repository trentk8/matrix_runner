import Constants from "../core/Constants.js";
import MazeData from "./MazeData.js";

const { DIRECTIONS } = MazeData;

const MODULUS = 2 ** 31 - 1;
const MULTIPLIER = 48271;

const createSeed = (seed) => {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return Math.abs(Math.floor(seed)) % MODULUS || 1;
  }
  if (typeof seed === "string") {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) % MODULUS;
    }
    return hash || 1;
  }
  return Math.floor(Math.random() * (MODULUS - 1)) + 1;
};

const createRng = (seed) => {
  let state = createSeed(seed);
  return () => {
    state = (state * MULTIPLIER) % MODULUS;
    return state / MODULUS;
  };
};

class MazeGenerator {
  constructor(mazeData) {
    this.mazeData = mazeData;
    this._rng = Math.random;
  }

  generate(config = {}) {
    const width = Math.max(
      Constants.MAZE.MIN_SIZE,
      Math.min(Constants.MAZE.MAX_SIZE, Math.floor(config.width ?? this.mazeData.width ?? Constants.MAZE.DEFAULT_WIDTH))
    );
    const height = Math.max(
      Constants.MAZE.MIN_SIZE,
      Math.min(Constants.MAZE.MAX_SIZE, Math.floor(config.height ?? this.mazeData.height ?? Constants.MAZE.DEFAULT_HEIGHT))
    );
    const seed = config.seed ?? Date.now();

    if (!this.mazeData) {
      this.mazeData = new MazeData(width, height);
    } else if (this.mazeData.width !== width || this.mazeData.height !== height) {
      this.mazeData.resize(width, height);
    } else {
      this.mazeData.reset();
    }

    this._rng = createRng(seed);
    this._carveRecursiveBacktracker();

    return {
      width,
      height,
      algorithm: Constants.MAZE.ALGORITHMS.RECURSIVE_BACKTRACKER,
      seed
    };
  }

  _carveRecursiveBacktracker() {
    const { width, height } = this.mazeData;
    const totalCells = width * height;
    const stack = new Array(totalCells);
    let stackSize = 0;

    const startX = Math.floor(this._rng() * width);
    const startY = Math.floor(this._rng() * height);
    let currentX = startX;
    let currentY = startY;
    this.mazeData.reset();
    this.mazeData.setVisited(currentX, currentY, true);
    let visitedCells = 1;

    while (visitedCells < totalCells) {
      const neighbors = this._unvisitedNeighbors(currentX, currentY);
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(this._rng() * neighbors.length)];
        this.mazeData.removeWall(currentX, currentY, next.direction);
        stack[stackSize] = { x: currentX, y: currentY };
        stackSize += 1;
        currentX = next.x;
        currentY = next.y;
        if (!this.mazeData.isVisited(currentX, currentY)) {
          this.mazeData.setVisited(currentX, currentY, true);
          visitedCells += 1;
        }
      } else if (stackSize > 0) {
        stackSize -= 1;
        const cell = stack[stackSize];
        currentX = cell.x;
        currentY = cell.y;
      } else {
        break;
      }
    }

    this.mazeData.resetVisited();
  }

  _unvisitedNeighbors(x, y) {
    const candidates = this.mazeData.getNeighbors(x, y);
    let availableCount = 0;
    const buffer = new Array(candidates.length);
    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      if (!this.mazeData.isVisited(candidate.x, candidate.y)) {
        buffer[availableCount] = candidate;
        availableCount += 1;
      }
    }

    if (availableCount <= 1) {
      return buffer.slice(0, availableCount);
    }

    for (let i = availableCount - 1; i > 0; i -= 1) {
      const j = Math.floor(this._rng() * (i + 1));
      const tmp = buffer[i];
      buffer[i] = buffer[j];
      buffer[j] = tmp;
    }
    return buffer.slice(0, availableCount);
  }
}

export default MazeGenerator;
