import Constants from "../core/Constants.js";

class PlayerController {
  constructor(canvas, camera, gameState) {
    this.canvas = canvas;
    this.camera = camera;
    this.gameState = gameState;
    this.movement = {
      forward: 0,
      strafe: 0,
      rotate: 0
    };
    this.sensitivity = 0.0025;
    this.isPointerLocked = false;

    this._bindEvents();
  }

  _bindEvents() {
    this._onKeyDown = (event) => this._handleKeyDown(event);
    this._onKeyUp = (event) => this._handleKeyUp(event);
    this._onMouseMove = (event) => this._handleMouseMove(event);
    this._onPointerLockChange = () => this._handlePointerLockChange();
    this._onPointerLockError = () => this._handlePointerLockError();
    this._onCanvasClick = () => this._requestPointerLock();

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    document.addEventListener("pointerlockchange", this._onPointerLockChange);
    document.addEventListener("pointerlockerror", this._onPointerLockError);
    document.addEventListener("mousemove", this._onMouseMove);
    this.canvas.addEventListener("click", this._onCanvasClick);
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    document.removeEventListener("pointerlockerror", this._onPointerLockError);
    document.removeEventListener("mousemove", this._onMouseMove);
    this.canvas.removeEventListener("click", this._onCanvasClick);
  }

  update(deltaTime) {
    if (this.movement.rotate !== 0) {
      const amount = this.movement.rotate * Constants.PLAYER.ROTATION_SPEED * deltaTime;
      this.camera.rotate(amount);
    }
    if (this.movement.forward !== 0 || this.movement.strafe !== 0) {
      this.camera.move(this.movement.forward, this.movement.strafe, deltaTime);
    }
  }

  _handleKeyDown(event) {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.movement.forward = 1;
        break;
      case "KeyS":
      case "ArrowDown":
        this.movement.forward = -1;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.movement.strafe = -1;
        break;
      case "KeyD":
      case "ArrowRight":
        this.movement.strafe = 1;
        break;
      case "KeyQ":
        this.movement.rotate = -1;
        break;
      case "KeyE":
        this.movement.rotate = 1;
        break;
      case Constants.DEBUG_KEYS.TOGGLE_DEBUG:
        this.gameState.toggleDebugFlag("showDebugOverlay");
        break;
      case Constants.DEBUG_KEYS.TOGGLE_FPS:
        this.gameState.toggleDebugFlag("showFPS");
        break;
      case Constants.DEBUG_KEYS.TOGGLE_GRID:
        this.gameState.toggleDebugFlag("showGrid");
        break;
      case Constants.DEBUG_KEYS.TOGGLE_MINIMAP:
        this.gameState.toggleDebugFlag("showMinimap");
        break;
      case Constants.DEBUG_KEYS.REGENERATE_MAZE:
        this.gameState.emit("maze:regenerate");
        break;
      case "Escape":
        document.exitPointerLock();
        break;
      default:
        break;
    }
  }

  _handleKeyUp(event) {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        if (this.movement.forward === 1) {
          this.movement.forward = 0;
        }
        break;
      case "KeyS":
      case "ArrowDown":
        if (this.movement.forward === -1) {
          this.movement.forward = 0;
        }
        break;
      case "KeyA":
      case "ArrowLeft":
        if (this.movement.strafe === -1) {
          this.movement.strafe = 0;
        }
        break;
      case "KeyD":
      case "ArrowRight":
        if (this.movement.strafe === 1) {
          this.movement.strafe = 0;
        }
        break;
      case "KeyQ":
        if (this.movement.rotate === -1) {
          this.movement.rotate = 0;
        }
        break;
      case "KeyE":
        if (this.movement.rotate === 1) {
          this.movement.rotate = 0;
        }
        break;
      default:
        break;
    }
  }

  _handleMouseMove(event) {
    if (!this.isPointerLocked) {
      return;
    }
    const delta = event.movementX * this.sensitivity;
    if (delta !== 0) {
      this.camera.rotate(delta);
    }
  }

  _requestPointerLock() {
    if (this.gameState.phase !== "running") {
      return;
    }
    if (document.pointerLockElement === this.canvas) {
      return;
    }
    this.canvas.requestPointerLock();
  }

  _handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  _handlePointerLockError() {
    this.isPointerLocked = false;
  }
}

export default PlayerController;

