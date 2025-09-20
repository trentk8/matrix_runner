const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

let overlayMenuCounter = 0;

class ControlOverlay {
  constructor(rootElement, options = {}) {
    this.rootElement = rootElement;
    this.playerController = options.playerController;
    this.onReset = typeof options.onReset === "function" ? options.onReset : () => {};
    this.onGiveUp = typeof options.onGiveUp === "function" ? options.onGiveUp : () => {};
    this._phase = options.phase ?? "boot";
    this._enabled = options.enabled ?? false;
    this._visible = false;
    this._menuOpen = false;

    this._moveState = { pointerId: null };
    this._lookState = { pointerId: null };
    this._overlayInput = { forward: 0, strafe: 0, rotate: 0 };

    this._build();
    this._bindJoysticks();
    this._bindMenu();
    this._updateVisibility();
  }

  setEnabled(enabled) {
    if (this._enabled === enabled) {
      return;
    }
    this._enabled = enabled;
    this._updateVisibility();
  }

  setPhase(phase) {
    if (this._phase === phase) {
      return;
    }
    this._phase = phase;
    this._updateVisibility();
  }

  reset() {
    this._resetMoveJoystick();
    this._resetLookJoystick();
    this._overlayInput.forward = 0;
    this._overlayInput.strafe = 0;
    this._overlayInput.rotate = 0;
    this._applyOverlayInput();
    this._closeMenu();
  }

  _build() {
    this.element = document.createElement("div");
    this.element.className = "control-overlay";
    this.element.setAttribute("data-visible", "false");
    this.element.innerHTML = `
      <div class="control-overlay__slot control-overlay__slot--left">
        <div class="control-overlay__joystick" data-joystick="move" aria-label="Movement control">
          <div class="control-overlay__ring"></div>
          <div class="control-overlay__thumb"></div>
          <div class="control-overlay__label">MOVE</div>
        </div>
      </div>
      <div class="control-overlay__slot control-overlay__slot--right">
        <div class="control-overlay__joystick" data-joystick="look" aria-label="Rotation control">
          <div class="control-overlay__ring"></div>
          <div class="control-overlay__thumb"></div>
          <div class="control-overlay__label">LOOK</div>
        </div>
      </div>
      <div class="control-overlay__menu" data-menu>
        <button type="button" class="control-overlay__menu-button">MENU</button>
        <div class="control-overlay__menu-panel" hidden>
          <button type="button" data-action="reset">RESET_RUN</button>
          <button type="button" data-action="giveup">GIVE_UP</button>
          <button type="button" data-action="close">CLOSE_PANEL</button>
        </div>
      </div>
    `;
    this.rootElement.appendChild(this.element);

    this.moveJoystick = this.element.querySelector('[data-joystick="move"]');
    this.lookJoystick = this.element.querySelector('[data-joystick="look"]');
    this.menu = this.element.querySelector("[data-menu]");
    this.menuButton = this.menu.querySelector(".control-overlay__menu-button");
    this.menuPanel = this.menu.querySelector(".control-overlay__menu-panel");
    this._menuPanelId = `control-overlay-menu-panel-${overlayMenuCounter++}`;
    this.menuPanel.id = this._menuPanelId;
    this.menuPanel.hidden = true;
    this.menuButton.setAttribute("aria-haspopup", "true");
    this.menuButton.setAttribute("aria-controls", this._menuPanelId);
    this.menuButton.setAttribute("aria-expanded", "false");
  }

  _bindJoysticks() {
    this._bindMoveJoystick();
    this._bindLookJoystick();
  }

  _bindMoveJoystick() {
    const handlePointerDown = (event) => {
      event.preventDefault();
      this.moveJoystick.setPointerCapture(event.pointerId);
      this._moveState.pointerId = event.pointerId;
      this._updateMoveJoystick(event);
    };

    const handlePointerMove = (event) => {
      if (this._moveState.pointerId !== event.pointerId) {
        return;
      }
      this._updateMoveJoystick(event);
    };

    const endInteraction = (event) => {
      if (this._moveState.pointerId !== event.pointerId) {
        return;
      }
      this.moveJoystick.releasePointerCapture(event.pointerId);
      this._moveState.pointerId = null;
      this._resetMoveJoystick();
      this._overlayInput.forward = 0;
      this._overlayInput.strafe = 0;
      this._applyOverlayInput();
    };

    this.moveJoystick.addEventListener("pointerdown", handlePointerDown);
    this.moveJoystick.addEventListener("pointermove", handlePointerMove);
    this.moveJoystick.addEventListener("pointerup", endInteraction);
    this.moveJoystick.addEventListener("pointercancel", endInteraction);
  }

  _bindLookJoystick() {
    const handlePointerDown = (event) => {
      event.preventDefault();
      this.lookJoystick.setPointerCapture(event.pointerId);
      this._lookState.pointerId = event.pointerId;
      this._updateLookJoystick(event);
    };

    const handlePointerMove = (event) => {
      if (this._lookState.pointerId !== event.pointerId) {
        return;
      }
      this._updateLookJoystick(event);
    };

    const endInteraction = (event) => {
      if (this._lookState.pointerId !== event.pointerId) {
        return;
      }
      this.lookJoystick.releasePointerCapture(event.pointerId);
      this._lookState.pointerId = null;
      this._resetLookJoystick();
      this._overlayInput.rotate = 0;
      this._applyOverlayInput();
    };

    this.lookJoystick.addEventListener("pointerdown", handlePointerDown);
    this.lookJoystick.addEventListener("pointermove", handlePointerMove);
    this.lookJoystick.addEventListener("pointerup", endInteraction);
    this.lookJoystick.addEventListener("pointercancel", endInteraction);
  }

  _bindMenu() {
    this.menuButton.addEventListener("click", () => {
      if (this._menuOpen) {
        this._closeMenu();
      } else {
        this._openMenu();
      }
    });

    this.menuPanel.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }
      const action = button.getAttribute("data-action");
      switch (action) {
        case "reset":
          this._closeMenu();
          this.onReset();
          break;
        case "giveup":
          this._closeMenu();
          this.onGiveUp();
          break;
        case "close":
        default:
          this._closeMenu();
          break;
      }
    });
  }

  _openMenu() {
    if (this._menuOpen) {
      return;
    }
    this._menuOpen = true;
    this.menuPanel.hidden = false;
    this.menuButton.setAttribute("aria-expanded", "true");
  }

  _closeMenu() {
    this._menuOpen = false;
    this.menuPanel.hidden = true;
    this.menuButton.setAttribute("aria-expanded", "false");
  }

  _updateMoveJoystick(event) {
    const rect = this.moveJoystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const radius = rect.width / 2;
    const distance = Math.min(Math.hypot(dx, dy), radius);
    const angle = Math.atan2(dy, dx);
    const normalizedX = clamp((distance * Math.cos(angle)) / radius, -1, 1);
    const normalizedY = clamp((distance * Math.sin(angle)) / radius, -1, 1);

    const thumb = this.moveJoystick.querySelector(".control-overlay__thumb");
    const maxOffset = radius * 0.6;
    thumb.style.transform = `translate(calc(-50% + ${normalizedX * maxOffset}px), calc(-50% + ${normalizedY * maxOffset}px))`;

    const strafe = Math.abs(normalizedX) < 0.1 ? 0 : normalizedX;
    const forward = Math.abs(normalizedY) < 0.1 ? 0 : -normalizedY;
    this._overlayInput.forward = clamp(forward, -1, 1);
    this._overlayInput.strafe = clamp(strafe, -1, 1);
    this._applyOverlayInput();
  }

  _updateLookJoystick(event) {
    const rect = this.lookJoystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const radius = rect.width / 2;
    const distance = Math.min(Math.hypot(dx, dy), radius);
    const angle = Math.atan2(dy, dx);
    const normalizedX = clamp((distance * Math.cos(angle)) / radius, -1, 1);
    const normalizedY = clamp((distance * Math.sin(angle)) / radius, -1, 1);

    const thumb = this.lookJoystick.querySelector(".control-overlay__thumb");
    const maxOffset = radius * 0.6;
    thumb.style.transform = `translate(calc(-50% + ${normalizedX * maxOffset}px), calc(-50% + ${normalizedY * maxOffset}px))`;

    const rotate = Math.abs(normalizedX) < 0.08 ? 0 : normalizedX;
    this._overlayInput.rotate = clamp(rotate, -1, 1);
    this._applyOverlayInput();
  }

  _resetMoveJoystick() {
    const thumb = this.moveJoystick.querySelector(".control-overlay__thumb");
    thumb.style.transform = "translate(-50%, -50%)";
  }

  _resetLookJoystick() {
    const thumb = this.lookJoystick.querySelector(".control-overlay__thumb");
    thumb.style.transform = "translate(-50%, -50%)";
  }

  _applyOverlayInput() {
    if (!this.playerController || typeof this.playerController.setOverlayVector !== "function") {
      return;
    }
    this.playerController.setOverlayVector({
      forward: this._overlayInput.forward,
      strafe: this._overlayInput.strafe,
      rotate: this._overlayInput.rotate
    });
  }

  _updateVisibility() {
    const shouldShow = this._enabled && this._phase === "running";
    if (this._visible === shouldShow) {
      return;
    }
    this._visible = shouldShow;
    this.element.setAttribute("data-visible", shouldShow ? "true" : "false");
    if (!shouldShow) {
      this.reset();
    }
  }
}

export default ControlOverlay;
