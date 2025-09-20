class MenuSystem {
  constructor(container, gameState) {
    this.container = container;
    this.gameState = gameState;
    this.handlers = {
      onStart: null,
      onRegenerate: null,
      onContinue: null,
      onAbort: null,
      onVictoryNew: null,
      onVictoryContinue: null,
      onVictoryArchive: null
    };
  }

  setHandlers(handlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  show(config = {}) {
    const mode = config.mode ?? "launch";
    this.container.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = `menu-panel menu-${mode}`;
    panel.innerHTML = this._buildMarkup(mode, config);
    this.container.appendChild(panel);
    this.container.style.opacity = "1";
    this.container.style.pointerEvents = "auto";
    this._wire(panel, mode, config);
  }

  hide() {
    this.container.innerHTML = "";
    this.container.style.opacity = "0";
    this.container.style.pointerEvents = "none";
  }

  _wire(panel, mode, config) {
    switch (mode) {
      case "pause":
        this._wirePause(panel);
        break;
      case "victory":
        this._wireVictory(panel, config);
        break;
      default:
        this._wireLaunch(panel, config);
        break;
    }
  }

  _wireLaunch(panel, config) {
    const form = panel.querySelector("form");
    if (!form) {
      return;
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const size = data.get("mazeSize");
      const [width, height] = size.split("x").map((value) => parseInt(value, 10));
      const seedValue = data.get("seed");
      const seed = seedValue && seedValue.trim().length > 0 ? seedValue.trim() : Date.now();
      if (this.handlers.onStart) {
        this.handlers.onStart({ width, height, seed });
      }
    });

    const randomBtn = panel.querySelector("[data-action=regenerate]");
    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        if (this.handlers.onRegenerate) {
          this.handlers.onRegenerate();
        }
      });
    }
  }

  _wirePause(panel) {
    const resume = panel.querySelector("[data-action=resume]");
    if (resume) {
      resume.addEventListener("click", () => {
        if (this.handlers.onContinue) {
          this.handlers.onContinue();
        }
      });
    }

    const regenerate = panel.querySelector("[data-action=regenerate]");
    if (regenerate) {
      regenerate.addEventListener("click", () => {
        if (this.handlers.onRegenerate) {
          this.handlers.onRegenerate();
        }
      });
    }

    const abort = panel.querySelector("[data-action=abort]");
    if (abort) {
      abort.addEventListener("click", () => {
        if (this.handlers.onAbort) {
          this.handlers.onAbort();
        }
      });
    }
  }

  _wireVictory(panel, config) {
    const continueBtn = panel.querySelector("[data-action=continue]");
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        if (this.handlers.onVictoryContinue) {
          this.handlers.onVictoryContinue();
        }
      });
    }

    const regenerate = panel.querySelector("[data-action=regenerate]");
    if (regenerate) {
      regenerate.addEventListener("click", () => {
        if (this.handlers.onVictoryNew) {
          this.handlers.onVictoryNew();
        }
      });
    }

    const archive = panel.querySelector("[data-action=archive]");
    if (archive) {
      archive.addEventListener("click", () => {
        if (this.handlers.onVictoryArchive) {
          this.handlers.onVictoryArchive(config.stats ?? {});
        }
      });
    }
  }

  _buildMarkup(mode, config) {
    switch (mode) {
      case "pause":
        return this._buildPauseMarkup();
      case "victory":
        return this._buildVictoryMarkup(config.stats ?? {});
      default:
        return this._buildLaunchMarkup(config);
    }
  }

  _buildLaunchMarkup(config) {
    const width = config.width ?? 25;
    const height = config.height ?? 25;
    const seed = typeof config.seed === "undefined" ? "" : String(config.seed);
    const sizeValue = `${width}x${height}`;
    const escapedSeed = this._escapeAttr(seed);
    return `
      <form>
        <h1>MATRIX RUNNER</h1>
        <p>SELECT MAZE CONFIGURATION:</p>
        <label>
          SIZE
          <select name="mazeSize">
            <option value="15x15" ${sizeValue === "15x15" ? "selected" : ""}>SMALL (15X15)</option>
            <option value="25x25" ${sizeValue === "25x25" ? "selected" : ""}>STANDARD (25X25)</option>
            <option value="50x50" ${sizeValue === "50x50" ? "selected" : ""}>LARGE (50X50)</option>
          </select>
        </label>
        <label>
          SEED
          <input name="seed" type="text" placeholder="ENTER_CUSTOM_SEED" value="${escapedSeed}" />
        </label>
        <button type="submit">PRESS [ENTER] TO INITIALIZE</button>
        <button type="button" data-action="regenerate">GENERATE_RANDOM</button>
      </form>
    `;
  }

  _buildPauseMarkup() {
    return `
      <div class="menu-header">
        <h1>SIMULATION PAUSED</h1>
        <p>SELECT NEXT ACTION:</p>
      </div>
      <div class="menu-actions">
        <button type="button" data-action="resume">RESUME_SIMULATION</button>
        <button type="button" data-action="regenerate">REGENERATE_MATRIX</button>
        <button type="button" data-action="abort">ABORT_RUN</button>
      </div>
      <p class="menu-hint">TIP: PRESS ESC TO TOGGLE PAUSE</p>
    `;
  }

  _buildVictoryMarkup(stats) {
    const runtime = this._formatRuntime(stats.runtimeSeconds ?? 0);
    const explored = Math.round((stats.exploredPercentage ?? 0) * 100);
    const dotPeak = stats.dotPeak ?? 0;
    return `
      <div class="menu-header">
        <h1>MATRIX NAVIGATION COMPLETE</h1>
        <p>SESSION SUMMARY</p>
      </div>
      <div class="menu-stats">
        <div>RUN_TIME: ${runtime}</div>
        <div>MAZE_DISCOVERED: ${explored}%</div>
        <div>DOT_PEAK: ${dotPeak}</div>
      </div>
      <div class="menu-actions">
        <button type="button" data-action="continue">CONTINUE_EXPLORATION</button>
        <button type="button" data-action="regenerate">GENERATE_NEW_MATRIX</button>
        <button type="button" data-action="archive">ARCHIVE_SESSION</button>
      </div>
    `;
  }

  _escapeAttr(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/'/g, "&#39;");
  }

  _formatRuntime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const secs = (total % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }
}

export default MenuSystem;
