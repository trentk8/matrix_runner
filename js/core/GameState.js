import Constants from "./Constants.js";
import EventBus from "./EventBus.js";

class GameState {
  constructor() {
    this._bus = new EventBus();
    this._phase = "boot";
    this._mazeConfig = {
      width: Constants.MAZE.DEFAULT_WIDTH,
      height: Constants.MAZE.DEFAULT_HEIGHT,
      algorithm: Constants.MAZE.ALGORITHMS.RECURSIVE_BACKTRACKER,
      seed: null
    };
    this._debug = {
      showDebugOverlay: false,
      showFPS: true,
      showGrid: false,
      showMinimap: true
    };
    this._stats = {
      fps: 0,
      exploredPercentage: 0,
      dotsThisFrame: 0,
      dotPeak: 0
    };
  }

  subscribe(eventName, handler) {
    return this._bus.on(eventName, handler);
  }

  emit(eventName, payload) {
    this._bus.emit(eventName, payload);
  }

  get phase() {
    return this._phase;
  }

  setPhase(phase) {
    if (this._phase === phase) {
      return;
    }
    this._phase = phase;
    this._bus.emit("state:phase", this._phase);
  }

  get mazeConfig() {
    return { ...this._mazeConfig };
  }

  updateMazeConfig(patch) {
    const next = { ...this._mazeConfig, ...patch };
    if (next.width < Constants.MAZE.MIN_SIZE || next.height < Constants.MAZE.MIN_SIZE) {
      throw new Error("Maze dimensions below minimum");
    }
    if (next.width > Constants.MAZE.MAX_SIZE || next.height > Constants.MAZE.MAX_SIZE) {
      throw new Error("Maze dimensions exceed maximum");
    }
    this._mazeConfig = next;
    this._bus.emit("maze:config", this.mazeConfig);
  }

  get debugFlags() {
    return { ...this._debug };
  }

  toggleDebugFlag(flag) {
    if (!(flag in this._debug)) {
      return;
    }
    this._debug[flag] = !this._debug[flag];
    this._bus.emit("debug:changed", this.debugFlags);
  }

  setDebugFlag(flag, value) {
    if (!(flag in this._debug) || this._debug[flag] === value) {
      return;
    }
    this._debug[flag] = value;
    this._bus.emit("debug:changed", this.debugFlags);
  }

  recordFPS(value) {
    this._stats.fps = value;
    this._bus.emit("stats:fps", value);
  }

  recordDotsRendered(count) {
    if (this._stats.dotsThisFrame !== count) {
      this._stats.dotsThisFrame = count;
      this._bus.emit("stats:dots", count);
    }
    if (count > this._stats.dotPeak) {
      this._stats.dotPeak = count;
    }
  }

  recordExploration(percentage) {
    const clamped = Math.min(Math.max(percentage, 0), 1);
    if (this._stats.exploredPercentage === clamped) {
      return;
    }
    this._stats.exploredPercentage = clamped;
    this._bus.emit("stats:explored", clamped);
  }

  getStats() {
    return { ...this._stats };
  }
}

export default GameState;
