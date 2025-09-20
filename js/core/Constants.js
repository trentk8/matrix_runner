const Constants = {
  COLORS: {
    WALL_NEAR: "#00FFFF",
    WALL_FAR: "#004080",
    FLOOR: "#202020",
    PLAYER: "#FF6600",
    BACKGROUND: "#0A0A0A",
    UI_TEXT: "#E0E0E0",
    SUCCESS: "#00FF00",
    ERROR: "#FF0000",
    WARNING: "#FF6600"
  },
  CAMERA: {
    FOV: Math.PI / 3,
    NEAR: 0.1,
    FAR: 20,
    HEIGHT: 1.6,
    VIEW_DISTANCE: 20,
    RAY_COUNT: 180
  },
  PLAYER: {
    MOVE_SPEED: 3.5,
    ROTATION_SPEED: Math.PI,
    COLLISION_RADIUS: 0.2,
    ACCELERATION: 12,
    DECELERATION: 12
  },
  MAZE: {
    DEFAULT_WIDTH: 25,
    DEFAULT_HEIGHT: 25,
    MIN_SIZE: 5,
    MAX_SIZE: 50,
    CELL_SIZE: 1,
    ALGORITHMS: {
      RECURSIVE_BACKTRACKER: "recursive_backtracker",
      PRIMS: "prims",
      CELLULAR_AUTOMATA: "cellular_automata"
    }
  },
  RENDERING: {
    MAX_DOTS_PER_FRAME: 24000,
    DOT_BASE_SIZE: 8,
    DOT_MIN_SIZE: 1,
    FLOOR_DOT_DENSITY: 0.5,
    DIRTY_RECT_PADDING: 8,
    MINIMAP_SCALE: 6,
    FPS_SMOOTHING: 0.15
  },
  UI: {
    MENU_FADE_MS: 220,
    NOTIFICATION_DURATION_MS: 3200
  },
  DEBUG_KEYS: {
    TOGGLE_DEBUG: "KeyD",
    TOGGLE_FPS: "KeyF",
    TOGGLE_GRID: "KeyG",
    TOGGLE_MINIMAP: "KeyM",
    REGENERATE_MAZE: "KeyR"
  }
};

export default Constants;

