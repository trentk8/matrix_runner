import Constants from "../core/Constants.js";
import {
  exitPointerLock,
  getPointerLockElement,
  POINTER_LOCK_CHANGE_EVENTS,
  POINTER_LOCK_ERROR_EVENTS,
  requestPointerLock
} from "../core/PointerLock.js";

class PlayerController {
  constructor(canvas, camera, gameState, options = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.gameState = gameState;
    this.inputSources = {
      keyboard: { forward: 0, strafe: 0, rotate: 0 },
      overlay: { forward: 0, strafe: 0, rotate: 0 }
    };
    this.movement = {
      forward: 0,
      strafe: 0,
      rotate: 0
    };
    this.sensitivity = 0.0025;
    this.isPointerLocked = false;
    this.enablePointerLock = options.enablePointerLock !== false;
    this._pointerLockChangeEvents = POINTER_LOCK_CHANGE_EVENTS;
    this._pointerLockErrorEvents = POINTER_LOCK_ERROR_EVENTS;

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
    this._pointerLockChangeEvents.forEach((eventName) => {
      document.addEventListener(eventName, this._onPointerLockChange);
    });
    this._pointerLockErrorEvents.forEach((eventName) => {
      document.addEventListener(eventName, this._onPointerLockError);
    });
    document.addEventListener("mousemove", this._onMouseMove);
    this.canvas.addEventListener("click", this._onCanvasClick);
  }

  setOverlayVector(vector = {}) {
    const source = this.inputSources.overlay;
    source.forward = this._normalizeAxis(vector.forward);
    source.strafe = this._normalizeAxis(vector.strafe);
    source.rotate = this._normalizeAxis(vector.rotate);
    this._updateMovement();
  }

  setPointerLockEnabled(enabled) {
    const next = Boolean(enabled);
    if (this.enablePointerLock === next) {
      return;
    }
    this.enablePointerLock = next;
    if (!this.enablePointerLock) {
      const lockedElement = getPointerLockElement();
      if (lockedElement === this.canvas) {
        exitPointerLock();
      }
    }
    const lockedElement = getPointerLockElement();
    this.isPointerLocked = this.enablePointerLock && lockedElement === this.canvas;
  }

  resetMovement() {
    const { keyboard, overlay } = this.inputSources;
    keyboard.forward = 0;
    keyboard.strafe = 0;
    keyboard.rotate = 0;
    overlay.forward = 0;
    overlay.strafe = 0;
    overlay.rotate = 0;
    this._updateMovement();
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    this._pointerLockChangeEvents.forEach((eventName) => {
      document.removeEventListener(eventName, this._onPointerLockChange);
    });
    this._pointerLockErrorEvents.forEach((eventName) => {
      document.removeEventListener(eventName, this._onPointerLockError);
    });
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
        this.inputSources.keyboard.forward = 1;
        break;
      case "KeyS":
      case "ArrowDown":
        this.inputSources.keyboard.forward = -1;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.inputSources.keyboard.strafe = -1;
        break;
      case "KeyD":
      case "ArrowRight":
        this.inputSources.keyboard.strafe = 1;
        break;
      case "KeyQ":
        this.inputSources.keyboard.rotate = -1;
        break;
      case "KeyE":
        this.inputSources.keyboard.rotate = 1;
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
      case "KeyP":
        if (this.gameState.phase === "running") {
          this.gameState.emit("ui:pauseRequested");
        } else if (this.gameState.phase === "paused") {
          this.gameState.emit("ui:resumeRequested");
        }
        exitPointerLock();
        break;
      default:
        break;
    }
    this._updateMovement();
  }

  _handleKeyUp(event) {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        if (this.inputSources.keyboard.forward === 1) {
          this.inputSources.keyboard.forward = 0;
        }
        break;
      case "KeyS":
      case "ArrowDown":
        if (this.inputSources.keyboard.forward === -1) {
          this.inputSources.keyboard.forward = 0;
        }
        break;
      case "KeyA":
      case "ArrowLeft":
        if (this.inputSources.keyboard.strafe === -1) {
          this.inputSources.keyboard.strafe = 0;
        }
        break;
      case "KeyD":
      case "ArrowRight":
        if (this.inputSources.keyboard.strafe === 1) {
          this.inputSources.keyboard.strafe = 0;
        }
        break;
      case "KeyQ":
        if (this.inputSources.keyboard.rotate === -1) {
          this.inputSources.keyboard.rotate = 0;
        }
        break;
      case "KeyE":
        if (this.inputSources.keyboard.rotate === 1) {
          this.inputSources.keyboard.rotate = 0;
        }
        break;
      default:
        break;
    }
    this._updateMovement();
  }

  _handleMouseMove(event) {
    if (!this.enablePointerLock || !this.isPointerLocked) {
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
    if (!this.enablePointerLock) {
      return;
    }
    const lockedElement = getPointerLockElement();
    if (lockedElement === this.canvas) {
      return;
    }
    requestPointerLock(this.canvas);
  }

  _normalizeAxis(value) {
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (Math.abs(value) < 0.0001) {
      return 0;
    }
    return Math.max(-1, Math.min(1, value));
  }

  _updateMovement() {
    const { keyboard, overlay } = this.inputSources;
    this.movement.forward = this._clampAxis(keyboard.forward + overlay.forward);
    this.movement.strafe = this._clampAxis(keyboard.strafe + overlay.strafe);
    this.movement.rotate = this._clampAxis(keyboard.rotate + overlay.rotate);
  }

  _clampAxis(value) {
    if (value > 1) {
      return 1;
    }
    if (value < -1) {
      return -1;
    }
    return value;
  }

  _handlePointerLockChange() {
    const wasLocked = this.isPointerLocked;
    const lockedElement = getPointerLockElement();
    this.isPointerLocked = this.enablePointerLock && lockedElement === this.canvas;
    if (wasLocked && !this.isPointerLocked && this.gameState.phase === "running") {
      this.gameState.emit("ui:pauseRequested");
    }
  }

  _handlePointerLockError() {
    this.isPointerLocked = false;
  }
}

export default PlayerController;
