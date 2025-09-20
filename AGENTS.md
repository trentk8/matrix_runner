# Matrix Runner - AI Agent Development Guide

## Project Overview
Matrix Runner is a browser-based first-person maze explorer with dot matrix rendering. This is a vanilla JavaScript project using HTML5 Canvas 2D, focusing on performance and retro-futuristic aesthetics.

## Quick Start Commands
```bash
# Initial setup (no build required initially)
- Open index.html in browser
- Use Live Server extension in VS Code for hot reload
- Run tests: Open test.html in browser (once created)

# When build system is added (Phase 2):
- Install: npm install
- Dev server: npm run dev
- Build: npm run build
- Test: npm run test
```

## Critical Architecture Decisions

### Rendering Pipeline
- **Canvas 2D only** - No WebGL, no 3D libraries
- **Dot-based rendering** - All visuals are colored squares/dots
- **Dirty rectangles** - Only redraw changed screen portions
- **Frustum culling** - Don't calculate dots outside view
- **LOD system** - Reduce dot density with distance

### Performance Requirements
- **Target**: 60fps on mid-range hardware (2018+ laptop)
- **Canvas size**: 1920x1080 default, responsive scaling
- **Max dots per frame**: ~10,000 for smooth performance
- **Culling threshold**: Don't render dots beyond 20 grid units

## Project Structure
```
/matrix-runner
├── index.html                 # Entry point, minimal HTML
├── css/
│   └── style.css             # Terminal aesthetic, monospace fonts
├── js/
│   ├── main.js               # Game initialization, event loop
│   ├── core/
│   │   ├── GameState.js     # Centralized state management
│   │   ├── EventBus.js      # Observer pattern implementation
│   │   └── Constants.js     # Game constants, colors, sizes
│   ├── maze/
│   │   ├── MazeGenerator.js # Maze generation algorithms
│   │   ├── MazeData.js      # Maze data structure (bit arrays)
│   │   └── FogOfWar.js      # Visibility and exploration tracking
│   ├── rendering/
│   │   ├── DotRenderer.js   # Main rendering engine
│   │   ├── MinimapRenderer.js # Top-down minimap
│   │   ├── ViewFrustum.js   # Frustum culling logic
│   │   └── LODSystem.js     # Level of detail management
│   ├── player/
│   │   ├── PlayerController.js # Movement and input
│   │   ├── CollisionSystem.js  # Wall collision detection
│   │   └── Camera.js          # First-person view calculations
│   └── ui/
│       ├── MenuSystem.js     # Terminal-style menus
│       ├── HUD.js           # In-game interface
│       └── Notifications.js # Status messages
└── assets/
    └── fonts/               # Monospace fonts if needed
```

## Code Style Guidelines

### JavaScript Standards
```javascript
// Use ES6+ features
const, let (no var)
Arrow functions for callbacks
Template literals for strings
Destructuring where it improves readability

// Naming conventions
Classes: PascalCase (DotRenderer)
Methods/variables: camelCase (renderDots)
Constants: UPPER_SNAKE (MAX_DOTS)
Private methods: prefix with _ (_calculateDistance)

// File organization
One class per file
Export as default
Import order: core → maze → rendering → player → ui
```

### Performance-Critical Code
```javascript
// Pre-allocate arrays
const dots = new Array(MAX_DOTS);

// Use object pools for frequent allocations
const dotPool = new ObjectPool(Dot, 1000);

// Avoid creating objects in render loops
// BAD: dots.map(d => ({ x: d.x, y: d.y }))
// GOOD: for loop with index access

// Cache calculations
const viewDistance = this._cachedViewDistance;
```

### Canvas Rendering Rules
```javascript
// Always use integer coordinates
ctx.fillRect(Math.floor(x), Math.floor(y), size, size);

// Batch similar operations
ctx.fillStyle = color;
// Draw all dots of same color together

// Clear only what changed (dirty rectangles)
ctx.clearRect(dirtyX, dirtyY, dirtyWidth, dirtyHeight);
```

## Development Workflow

### Phase 1 Implementation Order
1. **index.html** - Basic canvas setup
2. **Constants.js** - Colors, sizes, speeds
3. **MazeData.js** - Simple 2D array structure
4. **MazeGenerator.js** - Start with recursive backtracking only
5. **DotRenderer.js** - Basic dot drawing, no optimization
6. **PlayerController.js** - WASD movement, mouse look
7. **Camera.js** - First-person projection math
8. **main.js** - Game loop connecting everything

### Testing Strategy
- Manual testing via browser console initially
- Add test.html with simple assertion framework
- Test maze generation with known seeds
- Performance profiling with Chrome DevTools
- FPS counter always visible in dev mode

### Git Commit Standards
```bash
feat: Add maze generation algorithm
fix: Resolve collision detection bug
perf: Optimize dot rendering pipeline
style: Update UI color scheme
docs: Update AGENTS.md with new patterns
```

## Key Algorithms & Patterns

### Dot Distance Scaling
```javascript
// Dots get smaller with distance
const distance = Math.sqrt(dx * dx + dy * dy);
const dotSize = BASE_DOT_SIZE / (1 + distance * 0.1);
const opacity = Math.max(0.1, 1 - distance / MAX_VIEW_DISTANCE);
```

### Frustum Culling Check
```javascript
// Simple 2D frustum for first-person view
function isInFrustum(dotX, dotY, playerX, playerY, playerAngle) {
  const dx = dotX - playerX;
  const dy = dotY - playerY;
  const angle = Math.atan2(dy, dx);
  const angleDiff = Math.abs(angle - playerAngle);
  return angleDiff < FOV_HALF_ANGLE;
}
```

### Fog of War Updates
```javascript
// Use bit array for memory efficiency
// 1 bit per cell: 0 = unexplored, 1 = explored
const explored = new Uint8Array(Math.ceil(width * height / 8));
```

## Performance Optimization Checklist

### Before Every Commit
- [ ] No console.logs in production code
- [ ] No memory leaks (check Chrome DevTools)
- [ ] Maintains 60fps with medium maze (25x25)
- [ ] Dirty rectangle system working
- [ ] Frustum culling active

### Profiling Points
- Measure: Time spent in DotRenderer.render()
- Measure: Number of dots rendered per frame
- Measure: Canvas clear/draw call ratio
- Track: Memory usage over 5-minute session

## UI/UX Implementation Notes

### Terminal Aesthetic Rules
- All text in monospace font
- Colors from Constants.js only
- No gradients, only solid colors
- Status messages in UPPER_SNAKE_CASE
- Blink effect via CSS animation, not JS

### Color Palette (from Constants.js)
```javascript
const COLORS = {
  WALL_NEAR: '#00FFFF',    // Electric blue
  WALL_FAR: '#004080',      // Deep blue
  FLOOR: '#202020',         // Dark gray
  PLAYER: '#FF6600',        // Orange
  BACKGROUND: '#0A0A0A',    // Rich black
  UI_TEXT: '#E0E0E0',       // Light gray
  SUCCESS: '#00FF00',       // Terminal green
  ERROR: '#FF0000'          // Warning red
};
```

## Common Pitfalls to Avoid

### Performance Killers
- Creating new objects in render loop
- Using map/filter in hot paths
- Forgetting to clear canvas properly
- Rendering dots outside viewport
- Not using requestAnimationFrame

### Architecture Mistakes
- Tight coupling between renderer and game logic
- Storing maze as objects instead of arrays
- Not using dirty rectangles from start
- Forgetting to implement pause state
- Hard-coding canvas dimensions

## Debug Helpers

### Dev Mode Shortcuts
- Press 'D' - Toggle debug overlay
- Press 'F' - Show FPS counter
- Press 'G' - Show grid overlay
- Press 'M' - Force minimap toggle
- Press 'R' - Regenerate maze with same seed

### Console Commands (expose in dev)
```javascript
window.DEBUG = {
  showFrustum: () => {},     // Visualize view cone
  teleport: (x, y) => {},    // Jump to position
  revealAll: () => {},       // Remove fog of war
  showPerf: () => {}         // Performance stats
};
```

## Resource Limits

### Memory Budget
- Maze data: ~100KB for 50x50 maze
- Render cache: ~500KB for dot pools
- Explored map: ~10KB for bit array
- Total target: <2MB RAM usage

### CPU Budget
- Rendering: 50% of frame time (8ms)
- Game logic: 20% of frame time (3ms)
- Input handling: 10% of frame time (1.5ms)
- Leave 20% headroom

## Integration Points

### Save System (Future)
- Serialize: GameState.toJSON()
- Store: localStorage with 'MATRIX_RUNNER_SAVE'
- Version saves for compatibility

### Audio System (Future)
- Use Web Audio API
- Preload all sounds
- Object pool for sound instances
- Spatial audio for echo effects

## Questions to Ask Before Major Changes

1. Will this impact 60fps performance?
2. Does this maintain the terminal aesthetic?
3. Is this the simplest solution that works?
4. Can this be tested in isolation?
5. Does this follow the established patterns?

## Where to Find Examples

- Maze generation: Look at MazeGenerator.js header comments
- Dot scaling math: See DotRenderer._calculateDotSize()
- Input handling: Check PlayerController.bindEvents()
- State management: Review GameState.subscribe() pattern