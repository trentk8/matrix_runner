const NORTH = 1;
const SOUTH = 2;
const EAST = 4;
const WEST = 8;

const OPPOSITE = {
  [NORTH]: SOUTH,
  [SOUTH]: NORTH,
  [EAST]: WEST,
  [WEST]: EAST
};

const DELTAS = {
  [NORTH]: { dx: 0, dy: -1 },
  [SOUTH]: { dx: 0, dy: 1 },
  [EAST]: { dx: 1, dy: 0 },
  [WEST]: { dx: -1, dy: 0 }
};

class MazeData {
  constructor(width, height) {
    this.resize(width, height);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.cellCount = width * height;
    this.cells = new Uint8Array(this.cellCount);
    this.visited = new Uint8Array(this.cellCount);
    this._initWalls();
  }

  reset() {
    this._initWalls();
  }

  _initWalls() {
    this.cells.fill(NORTH | SOUTH | EAST | WEST);
    this.visited.fill(0);
  }

  index(x, y) {
    return y * this.width + x;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  hasWall(x, y, direction) {
    const idx = this.index(x, y);
    return (this.cells[idx] & direction) !== 0;
  }

  removeWall(x, y, direction) {
    const idx = this.index(x, y);
    this.cells[idx] &= ~direction;
    const delta = DELTAS[direction];
    const nx = x + delta.dx;
    const ny = y + delta.dy;
    if (this.inBounds(nx, ny)) {
      const neighborIdx = this.index(nx, ny);
      this.cells[neighborIdx] &= ~OPPOSITE[direction];
    }
  }

  addWall(x, y, direction) {
    const idx = this.index(x, y);
    this.cells[idx] |= direction;
    const delta = DELTAS[direction];
    const nx = x + delta.dx;
    const ny = y + delta.dy;
    if (this.inBounds(nx, ny)) {
      const neighborIdx = this.index(nx, ny);
      this.cells[neighborIdx] |= OPPOSITE[direction];
    }
  }

  isVisited(x, y) {
    return this.visited[this.index(x, y)] === 1;
  }

  setVisited(x, y, value = true) {
    this.visited[this.index(x, y)] = value ? 1 : 0;
  }

  resetVisited() {
    this.visited.fill(0);
  }

  forEachCell(callback) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        callback(x, y, this.cells[this.index(x, y)]);
      }
    }
  }

  getNeighbors(x, y) {
    const neighbors = [];
    for (const direction of [NORTH, SOUTH, EAST, WEST]) {
      const delta = DELTAS[direction];
      const nx = x + delta.dx;
      const ny = y + delta.dy;
      if (this.inBounds(nx, ny)) {
        neighbors.push({ x: nx, y: ny, direction });
      }
    }
    return neighbors;
  }
}

MazeData.DIRECTIONS = { NORTH, SOUTH, EAST, WEST };
MazeData.DELTAS = DELTAS;

export default MazeData;
