import Constants from "./core/Constants.js";
import GameState from "./core/GameState.js";
import MazeData from "./maze/MazeData.js";
import MazeGenerator from "./maze/MazeGenerator.js";
import FogOfWar from "./maze/FogOfWar.js";
import Camera from "./player/Camera.js";
import CollisionSystem from "./player/CollisionSystem.js";
import PlayerController from "./player/PlayerController.js";
import LODSystem from "./rendering/LODSystem.js";
import DotRenderer from "./rendering/DotRenderer.js";
import MinimapRenderer from "./rendering/MinimapRenderer.js";
import ViewFrustum from "./rendering/ViewFrustum.js";
import MenuSystem from "./ui/MenuSystem.js";
import HUD from "./ui/HUD.js";
import Notifications from "./ui/Notifications.js";

class MatrixRunnerApp {
  constructor() {
    this.state = new GameState();
    this.canvas = document.getElementById("gameCanvas");
    this.minimapCanvas = document.getElementById("minimapCanvas");
    this.hudElement = document.getElementById("hud");
    this.menuElement = document.getElementById("menu");
    this.notificationElement = document.getElementById("notifications");

    this.camera = new Camera();
    this.viewFrustum = new ViewFrustum(this.camera);
    this.lodSystem = new LODSystem();
    this.dotRenderer = new DotRenderer(this.canvas, this.camera, this.lodSystem);

    this.mazeData = new MazeData(Constants.MAZE.DEFAULT_WIDTH, Constants.MAZE.DEFAULT_HEIGHT);
    this.mazeGenerator = new MazeGenerator(this.mazeData);
    this.fogOfWar = new FogOfWar(this.mazeData.width, this.mazeData.height);
    this.collisionSystem = new CollisionSystem(this.mazeData);

    this.camera.setMaze(this.mazeData);
    this.camera.setCollisionSystem(this.collisionSystem);

    this.playerController = new PlayerController(this.canvas, this.camera, this.state);
    this.minimapRenderer = new MinimapRenderer(this.minimapCanvas);
    this.minimapRenderer.setMaze(this.mazeData, this.fogOfWar);

    this.menu = new MenuSystem(this.menuElement, this.state);
    this.hud = new HUD(this.hudElement, this.state);
    this.notifications = new Notifications(this.notificationElement);

    this._fps = 0;
    this._lastTimestamp = performance.now();
    this._runStartTime = null;
    this._runCompleted = false;
    this._exitPosition = { x: this.mazeData.width - 0.5, y: this.mazeData.height - 0.5 };
    this._lastStats = null;

    this._bindGameState();
    this._registerDebugHelpers();
    this._handleResize();
    window.addEventListener("resize", () => this._handleResize());
  }

  init() {
    this.menu.setHandlers({
      onStart: (config) => this._bootGame(config),
      onRegenerate: () => this._handleRegenerateRequest(),
      onContinue: () => this._resumeGame(),
      onAbort: () => this._abortRunToMenu("SESSION_TERMINATED", "error"),
      onVictoryNew: () => this._restartAfterVictory(),
      onVictoryContinue: () => this._continueExploration(),
      onVictoryArchive: (stats) => this._archiveSession(stats)
    });
    this.menu.show({ mode: "launch", ...this.state.mazeConfig });
    this.state.setPhase("menu");
    this.notifications.info("SYSTEM_READY");
    requestAnimationFrame((timestamp) => this._loop(timestamp));
  }

  _bindGameState() {
    this.state.subscribe("maze:regenerate", () => {
      this._handleRegenerateRequest();
    });

    this.state.subscribe("debug:changed", (flags) => {
      this.minimapCanvas.style.display = flags.showMinimap ? "block" : "none";
    });

    this.state.subscribe("ui:pauseRequested", () => {
      this._pauseGame();
    });

    this.state.subscribe("ui:resumeRequested", () => {
      this._resumeGame();
    });
  }

  _bootGame(config) {
    this.state.updateMazeConfig(config);
    this._regenerateMaze(config);
    this.menu.hide();
    this.notifications.clear();
    this.notifications.success("SIMULATION_INITIALIZED");
    this._runStartTime = performance.now();
    this._runCompleted = false;
    this.state.setPhase("running");
  }

  _handleRegenerateRequest() {
    const phase = this.state.phase;
    if (phase === "menu") {
      const seed = Date.now();
      this.state.updateMazeConfig({ seed });
      this.menu.show({ mode: "launch", ...this.state.mazeConfig, seed });
      this.notifications.info("SEED_RANDOMIZED");
      return;
    }

    const seed = Date.now();
    this._regenerateMaze({ seed });
    this.menu.hide();
    this._runStartTime = performance.now();
    this._runCompleted = false;
    this.notifications.success("NEW_MATRIX_DEPLOYED");
    this.state.setPhase("running");
  }

  _pauseGame() {
    if (this.state.phase !== "running") {
      return;
    }
    this.state.setPhase("paused");
    document.exitPointerLock();
    this.menu.show({ mode: "pause" });
    this.notifications.info("SIMULATION_PAUSED");
  }

  _resumeGame() {
    if (this.state.phase !== "paused") {
      return;
    }
    this.menu.hide();
    this.state.setPhase("running");
    this.notifications.info("SIMULATION_RESUMED");
  }

    _abortRunToMenu(message, level = "info") {
    document.exitPointerLock();
    this._runCompleted = false;
    this.menu.show({ mode: "launch", ...this.state.mazeConfig });
    this.state.setPhase("menu");
    if (message) {
      const notifier = typeof this.notifications[level] === "function"
        ? this.notifications[level].bind(this.notifications)
        : this.notifications.info.bind(this.notifications);
      notifier(message);
    }
  }

  _restartAfterVictory() {
    this._runCompleted = false;
    this._regenerateMaze({ seed: Date.now() });
    this.menu.hide();
    this._runStartTime = performance.now();
    this.notifications.success("NEW_MATRIX_DEPLOYED");
    this.state.setPhase("running");
  }

  _continueExploration() {
    if (this.state.phase !== "complete") {
      return;
    }
    this.menu.hide();
    this.notifications.info("EXPLORATION_MODE_ACTIVE");
    this.state.setPhase("running");
  }

  _archiveSession(stats) {
    console.table({
      RUNTIME_SECONDS: (stats.runtimeSeconds ?? 0).toFixed(2),
      EXPLORED_PERCENT: Math.round((stats.exploredPercentage ?? 0) * 100),
      DOT_PEAK: stats.dotPeak ?? 0
    });
    this.notifications.success("SESSION_ARCHIVED");
    this._abortRunToMenu("SESSION_TERMINATED", "info");
  }

  _regenerateMaze(configOverrides = {}) {
    const config = { ...this.state.mazeConfig, ...configOverrides };
    const result = this.mazeGenerator.generate(config);
    this.state.updateMazeConfig(result);

    this.fogOfWar.resize(this.mazeData.width, this.mazeData.height);
    this.fogOfWar.reset();
    this.collisionSystem.setMaze(this.mazeData);
    this.camera.setMaze(this.mazeData);
    this.camera.setPosition(0.5, 0.5);
    this.playerController.movement.forward = 0;
    this.playerController.movement.strafe = 0;
    this.playerController.movement.rotate = 0;
    this.minimapRenderer.setMaze(this.mazeData, this.fogOfWar);

    this._exitPosition = {
      x: this.mazeData.width - 0.5,
      y: this.mazeData.height - 0.5
    };
    this._runCompleted = false;
    this.state.recordExploration(0);
    this.state.recordDotsRendered(0);
    this._openMazeEntrances();
  }

  _openMazeEntrances() {
    const { DIRECTIONS } = MazeData;
    this.mazeData.removeWall(0, 0, DIRECTIONS.WEST);
    this.mazeData.removeWall(this.mazeData.width - 1, this.mazeData.height - 1, DIRECTIONS.EAST);
  }

  _handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.dotRenderer.resize(width, height);
  }

  _loop(timestamp) {
    const delta = (timestamp - this._lastTimestamp) / 1000;
    this._lastTimestamp = timestamp;

    if (this.state.phase === "running") {
      this.playerController.update(delta);
      const scene = this.camera.castRays();
      this.fogOfWar.setVisibleCells(scene.visibleCells);
      this.dotRenderer.markDirty(0, 0, this.canvas.width, this.canvas.height);
      this.dotRenderer.beginFrame();
      const dots = this.dotRenderer.render(scene);
      const flags = this.state.debugFlags;
      if (flags.showMinimap) {
        this.minimapRenderer.render(this.camera, flags);
      }
      this.state.recordDotsRendered(dots);
      this.state.recordExploration(this.fogOfWar.getExploredRatio());
      this._updateFps(delta);
      this._checkCompletion();
    } else if (this.state.debugFlags.showMinimap) {
      this.minimapRenderer.render(this.camera, this.state.debugFlags);
    }

    requestAnimationFrame((time) => this._loop(time));
  }

  _updateFps(delta) {
    const smoothing = Constants.RENDERING.FPS_SMOOTHING;
    const instantaneous = 1 / Math.max(delta, 0.0001);
    this._fps += (instantaneous - this._fps) * smoothing;
    this.state.recordFPS(this._fps);
  }

  _checkCompletion() {
    if (this._runCompleted || !this._exitPosition) {
      return;
    }
    const dx = this.camera.position.x - this._exitPosition.x;
    const dy = this.camera.position.y - this._exitPosition.y;
    if (Math.hypot(dx, dy) <= 0.45) {
      this._handleRunComplete();
    }
  }

  _handleRunComplete() {
    this._runCompleted = true;
    document.exitPointerLock();
    const stats = this._collectRunStats();
    this._lastStats = stats;
    this.state.setPhase("complete");
    this.notifications.success("MATRIX_NAVIGATION_COMPLETE");
    this.menu.show({ mode: "victory", stats });
  }

  _collectRunStats() {
    const stats = this.state.getStats();
    const now = performance.now();
    const runtimeSeconds = this._runStartTime ? (now - this._runStartTime) / 1000 : 0;
    return {
      runtimeSeconds,
      exploredPercentage: stats.exploredPercentage,
      dotPeak: stats.dotPeak
    };
  }

  _registerDebugHelpers() {
    window.DEBUG = {
      showFrustum: () => this.state.toggleDebugFlag("showDebugOverlay"),
      teleport: (x, y) => {
        if (Number.isFinite(x) && Number.isFinite(y)) {
          this.camera.setPosition(x, y);
        }
      },
      revealAll: () => {
        const indices = new Uint32Array(this.mazeData.width * this.mazeData.height);
        for (let i = 0; i < indices.length; i += 1) {
          indices[i] = i;
        }
        this.fogOfWar.setVisibleCells(indices);
        this.state.recordExploration(1);
      },
      showPerf: () => this.state.toggleDebugFlag("showFPS"),
      pause: () => this._pauseGame(),
      resume: () => this._resumeGame()
    };
  }
}

const app = new MatrixRunnerApp();
app.init();












