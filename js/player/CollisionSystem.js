import Constants from "../core/Constants.js";
import MazeData from "../maze/MazeData.js";

const { DIRECTIONS } = MazeData;

class CollisionSystem {
  constructor(mazeData) {
    this.setMaze(mazeData);
    this.radius = Constants.PLAYER.COLLISION_RADIUS;
  }

  setMaze(mazeData) {
    this.maze = mazeData;
  }

  resolveMovement(startX, startY, targetX, targetY) {
    if (!this.maze) {
      return { x: targetX, y: targetY };
    }
    let x = targetX;
    let y = targetY;

    ({ x, y } = this._clampToBounds(x, y));
    ({ x, y } = this._pushOut(x, y));
    ({ x, y } = this._pushOut(x, y));

    return { x, y };
  }

  _clampToBounds(x, y) {
    const maxX = this.maze.width - this.radius;
    const maxY = this.maze.height - this.radius;
    const clampedX = Math.min(Math.max(x, this.radius), maxX);
    const clampedY = Math.min(Math.max(y, this.radius), maxY);
    return { x: clampedX, y: clampedY };
  }

  _pushOut(x, y) {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    if (!this.maze.inBounds(cellX, cellY)) {
      return this._clampToBounds(x, y);
    }

    const radius = this.radius;
    let adjustedX = x;
    let adjustedY = y;

    const localX = x - cellX;
    const localY = y - cellY;

    if (this._hasWall(cellX, cellY, DIRECTIONS.WEST) && localX < radius) {
      adjustedX = cellX + radius;
    }
    if (this._hasWall(cellX, cellY, DIRECTIONS.EAST) && 1 - localX < radius) {
      adjustedX = cellX + 1 - radius;
    }
    if (this._hasWall(cellX, cellY, DIRECTIONS.NORTH) && localY < radius) {
      adjustedY = cellY + radius;
    }
    if (this._hasWall(cellX, cellY, DIRECTIONS.SOUTH) && 1 - localY < radius) {
      adjustedY = cellY + 1 - radius;
    }

    return { x: adjustedX, y: adjustedY };
  }

  _hasWall(x, y, direction) {
    if (!this.maze.inBounds(x, y)) {
      return true;
    }
    return this.maze.hasWall(x, y, direction);
  }
}

export default CollisionSystem;
