import Constants from "../core/Constants.js";
import MazeData from "../maze/MazeData.js";

const { DIRECTIONS } = MazeData;

class Camera {
  constructor() {
    this.position = { x: 1.5, y: 1.5 };
    this.angle = 0;
    this.fov = Constants.CAMERA.FOV;
    this.maxDistance = Constants.CAMERA.VIEW_DISTANCE;
    this._rayCount = Constants.CAMERA.RAY_COUNT;
    this._rayBuffer = new Array(this._rayCount);
    for (let i = 0; i < this._rayCount; i += 1) {
      this._rayBuffer[i] = {
        distance: this.maxDistance,
        side: 0,
        direction: DIRECTIONS.NORTH,
        cellX: 0,
        cellY: 0,
        hitX: 0,
        hitY: 0,
        rayDirX: 0,
        rayDirY: 0,
        rayAngle: 0
      };
    }
    this._visibleMask = new Uint8Array(0);
    this._visibleCells = new Uint32Array(0);
    this._visibleCount = 0;
    this._collisionSystem = null;
    this._maze = null;
  }

  setMaze(mazeData) {
    this._maze = mazeData;
    const cellCount = mazeData.width * mazeData.height;
    this._visibleMask = new Uint8Array(cellCount);
    this._visibleCells = new Uint32Array(cellCount);
    this._visibleCount = 0;
  }

  setCollisionSystem(collisionSystem) {
    this._collisionSystem = collisionSystem;
  }

  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  move(forward, strafe, deltaTime) {
    if (!this._collisionSystem) {
      return;
    }
    const sin = Math.sin(this.angle);
    const cos = Math.cos(this.angle);
    const speed = Constants.PLAYER.MOVE_SPEED * deltaTime;
    const targetX = this.position.x + (cos * forward - sin * strafe) * speed;
    const targetY = this.position.y + (sin * forward + cos * strafe) * speed;
    const resolved = this._collisionSystem.resolveMovement(this.position.x, this.position.y, targetX, targetY);
    this.position.x = resolved.x;
    this.position.y = resolved.y;
  }

  rotate(deltaAngle) {
    this.angle = (this.angle + deltaAngle + Math.PI * 2) % (Math.PI * 2);
  }

  castRays() {
    if (!this._maze) {
      throw new Error("Camera maze not set");
    }

    const { width, height } = this._maze;
    const posX = this.position.x;
    const posY = this.position.y;
    const rayCount = this._rayCount;
    const maxDistance = this.maxDistance;

    this._visibleMask.fill(0);
    this._visibleCount = 0;

    const addVisible = (cellX, cellY) => {
      if (cellX < 0 || cellX >= width || cellY < 0 || cellY >= height) {
        return;
      }
      const index = cellY * width + cellX;
      if (this._visibleMask[index] === 0) {
        this._visibleMask[index] = 1;
        this._visibleCells[this._visibleCount] = index;
        this._visibleCount += 1;
      }
    };

    const angleStep = this.fov / (rayCount - 1);

    for (let i = 0; i < rayCount; i += 1) {
      const buffer = this._rayBuffer[i];
      let currentX = Math.floor(posX);
      let currentY = Math.floor(posY);
      addVisible(currentX, currentY);

      const rayAngle = this.angle - this.fov / 2 + angleStep * i;
      const rayDirX = Math.cos(rayAngle);
      const rayDirY = Math.sin(rayAngle);

      const deltaDistX = rayDirX === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayDirX);
      const deltaDistY = rayDirY === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / rayDirY);

      const stepX = rayDirX < 0 ? -1 : 1;
      const stepY = rayDirY < 0 ? -1 : 1;

      let sideDistX = rayDirX < 0 ? (posX - currentX) * deltaDistX : (currentX + 1 - posX) * deltaDistX;
      let sideDistY = rayDirY < 0 ? (posY - currentY) * deltaDistY : (currentY + 1 - posY) * deltaDistY;

      let distance = 0;
      let hit = false;
      let side = 0;
      let boundaryDirection = DIRECTIONS.NORTH;

      while (!hit && distance < maxDistance) {
        if (sideDistX < sideDistY) {
          distance = sideDistX;
          sideDistX += deltaDistX;
          boundaryDirection = stepX > 0 ? DIRECTIONS.EAST : DIRECTIONS.WEST;
          if (this._hasWall(currentX, currentY, boundaryDirection)) {
            hit = true;
          } else {
            currentX += stepX;
            addVisible(currentX, currentY);
          }
          side = 0;
        } else {
          distance = sideDistY;
          sideDistY += deltaDistY;
          boundaryDirection = stepY > 0 ? DIRECTIONS.SOUTH : DIRECTIONS.NORTH;
          if (this._hasWall(currentX, currentY, boundaryDirection)) {
            hit = true;
          } else {
            currentY += stepY;
            addVisible(currentX, currentY);
          }
          side = 1;
        }
      }

      if (distance > maxDistance) {
        distance = maxDistance;
      }

      buffer.distance = distance;
      buffer.side = side;
      buffer.direction = boundaryDirection;
      buffer.cellX = currentX;
      buffer.cellY = currentY;
      buffer.hitX = posX + rayDirX * distance;
      buffer.hitY = posY + rayDirY * distance;
      buffer.rayDirX = rayDirX;
      buffer.rayDirY = rayDirY;
      buffer.rayAngle = rayAngle;
    }

    return {
      rays: this._rayBuffer,
      rayCount,
      visibleCells: this._visibleCells.subarray(0, this._visibleCount)
    };
  }

  _hasWall(x, y, direction) {
    if (!this._maze.inBounds(x, y)) {
      return true;
    }
    return this._maze.hasWall(x, y, direction);
  }
}

export default Camera;
