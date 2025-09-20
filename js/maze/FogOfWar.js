class FogOfWar {
  constructor(width, height) {
    this.resize(width, height);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.cellCount = width * height;
    this.visible = new Uint8Array(this.cellCount);
    this.explored = new Uint8Array(Math.ceil(this.cellCount / 8));
  }

  reset() {
    this.visible.fill(0);
    this.explored.fill(0);
  }

  revealAll() {
    this.visible.fill(1);
    this.explored.fill(0xff);
    const remainder = this.cellCount & 7;
    if (remainder !== 0 && this.explored.length > 0) {
      const mask = (1 << remainder) - 1;
      this.explored[this.explored.length - 1] = mask;
    }
  }

  setVisibleCells(cells) {
    this.visible.fill(0);
    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      let index;
      if (typeof cell === "number") {
        index = cell;
      } else if (Array.isArray(cell)) {
        index = cell[1] * this.width + cell[0];
      } else {
        index = this._coordinateToIndex(cell.x, cell.y);
      }
      if (index >= 0 && index < this.cellCount) {
        this.visible[index] = 1;
        this._setExploredBit(index);
      }
    }
  }

  isVisible(x, y) {
    return this.visible[this._coordinateToIndex(x, y)] === 1;
  }

  isExplored(x, y) {
    const index = this._coordinateToIndex(x, y);
    const byteIndex = index >> 3;
    const bitMask = 1 << (index & 7);
    return (this.explored[byteIndex] & bitMask) !== 0;
  }

  getExploredRatio() {
    let exploredCount = 0;
    for (let i = 0; i < this.explored.length; i += 1) {
      let byte = this.explored[i];
      if (byte === 0) {
        continue;
      }
      while (byte) {
        exploredCount += 1;
        byte &= byte - 1;
      }
    }
    return exploredCount / this.cellCount;
  }

  _coordinateToIndex(x, y) {
    return y * this.width + x;
  }

  _setExploredBit(index) {
    const byteIndex = index >> 3;
    const bitMask = 1 << (index & 7);
    this.explored[byteIndex] |= bitMask;
  }
}

export default FogOfWar;
