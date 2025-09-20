class HUD {
  constructor(container, gameState) {
    this.container = container;
    this.gameState = gameState;
    this._elements = {};
    this._renderBase();
    this._bind();
  }

  _renderBase() {
    this.container.innerHTML = `
      <div class="hud-line" data-hud="phase">STATE: BOOT</div>
      <div class="hud-line fps-counter" data-hud="fps">FPS: --</div>
      <div class="hud-line" data-hud="explored">EXPLORED: 0%</div>
      <div class="hud-line" data-hud="dots">DOTS: 0</div>
      <div class="hud-line" data-hud="seed">SEED: --</div>
      <div class="hud-line" data-hud="hint">CLICK TO INITIALIZE</div>
      <button type="button" class="hud-button" data-hud="menuToggle" aria-live="polite">MENU_LOCKED</button>
    `;
    this._elements.phase = this.container.querySelector('[data-hud="phase"]');
    this._elements.fps = this.container.querySelector('[data-hud="fps"]');
    this._elements.explored = this.container.querySelector('[data-hud="explored"]');
    this._elements.dots = this.container.querySelector('[data-hud="dots"]');
    this._elements.seed = this.container.querySelector('[data-hud="seed"]');
    this._elements.hint = this.container.querySelector('[data-hud="hint"]');
    this._elements.menuToggle = this.container.querySelector('[data-hud="menuToggle"]');
    if (this._elements.menuToggle) {
      this._elements.menuToggle.addEventListener("click", () => this._handleMenuToggle());
    }
    this._syncMenuToggle();
  }

  _bind() {
    this.gameState.subscribe("state:phase", (phase) => {
      this._elements.phase.textContent = `STATE: ${phase.toUpperCase()}`;
      switch (phase) {
        case "running":
          this._elements.hint.textContent = "WASD // MOVE   MOUSE // ORIENT   ESC/P // MENU";
          break;
        case "paused":
          this._elements.hint.textContent = "MENU ACTIVE // ESC OR BUTTON TO RESUME";
          break;
        case "complete":
          this._elements.hint.textContent = "SESSION COMPLETE // REVIEW OPTIONS";
          break;
        default:
          this._elements.hint.textContent = "CLICK TO INITIALIZE";
          break;
      }
      this._syncMenuToggle();
    });

    this.gameState.subscribe("stats:fps", (fps) => {
      this._elements.fps.textContent = `FPS: ${fps.toFixed(0)}`;
    });

    this.gameState.subscribe("stats:dots", (count) => {
      this._elements.dots.textContent = `DOTS: ${count}`;
    });

    this.gameState.subscribe("stats:explored", (ratio) => {
      const percent = Math.round(ratio * 100);
      this._elements.explored.textContent = `EXPLORED: ${percent}%`;
    });

    this.gameState.subscribe("maze:config", (config) => {
      this._elements.seed.textContent = `SEED: ${String(config.seed).toUpperCase()}`;
    });

    this.gameState.subscribe("debug:changed", (flags) => {
      if (flags.showFPS) {
        this._elements.fps.style.display = "block";
      } else {
        this._elements.fps.style.display = "none";
      }
    });
  }

  _handleMenuToggle() {
    const phase = this.gameState.phase;
    if (phase === "running") {
      this.gameState.emit("ui:pauseRequested");
    } else if (phase === "paused") {
      this.gameState.emit("ui:resumeRequested");
    }
  }

  _syncMenuToggle() {
    const button = this._elements.menuToggle;
    if (!button) {
      return;
    }
    const phase = this.gameState.phase;
    const actionable = phase === "running" || phase === "paused";
    button.disabled = !actionable;
    button.setAttribute("aria-disabled", actionable ? "false" : "true");
    button.setAttribute("aria-pressed", phase === "paused" ? "true" : "false");
    button.classList.toggle("hud-button--active", phase === "paused");
    if (phase === "paused") {
      button.textContent = "RESUME_RUN";
    } else if (phase === "running") {
      button.textContent = "OPEN_MENU";
    } else {
      button.textContent = "MENU_LOCKED";
    }
  }
}

export default HUD;
