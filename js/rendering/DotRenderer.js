import Constants from "../core/Constants.js";

class DotRenderer {
  constructor(canvas, camera, lodSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.camera = camera;
    this.lodSystem = lodSystem;
    this._dirty = { x: 0, y: 0, width: canvas.width, height: canvas.height };
    this._bgColor = Constants.COLORS.BACKGROUND;
    this.lastDotCount = 0;
    this._wallNearRGB = this._hexToRgb(Constants.COLORS.WALL_NEAR);
    this._wallFarRGB = this._hexToRgb(Constants.COLORS.WALL_FAR);
    const floorBase = this._hexToRgb(Constants.COLORS.FLOOR);
    this._floorNearRGB = this._scaleColor(floorBase, 1.9);
    this._floorFarRGB = this._scaleColor(floorBase, 0.3);
    const ceilingBase = this._hexToRgb(Constants.COLORS.WALL_FAR);
    this._ceilingNearRGB = this._scaleColor(ceilingBase, 1.15);
    this._ceilingFarRGB = this._scaleColor(ceilingBase, 0.32);
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
    this._dirty = { x: 0, y: 0, width, height };
  }

  markDirty(x, y, width, height) {
    const d = this._dirty;
    const minX = Math.min(d.x, x);
    const minY = Math.min(d.y, y);
    const maxX = Math.max(d.x + d.width, x + width);
    const maxY = Math.max(d.y + d.height, y + height);
    this._dirty = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  beginFrame() {
    const d = this._dirty;
    this.ctx.fillStyle = this._bgColor;
    this.ctx.fillRect(Math.floor(d.x), Math.floor(d.y), Math.ceil(d.width), Math.ceil(d.height));
    this._dirty = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };
  }

  render(scene) {
    const { rays, rayCount } = scene;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const columnWidth = width / rayCount;
    const maxDots = Constants.RENDERING.MAX_DOTS_PER_FRAME;
    const baseBudget = Math.max(1, Math.floor(maxDots / rayCount));
    let extraDots = maxDots - baseBudget * rayCount;
    let remainingBudget = maxDots;
    let dotCount = 0;

    for (let i = 0; i < rayCount && remainingBudget > 0; i += 1) {
      let columnBudget = baseBudget;
      if (extraDots > 0) {
        columnBudget += 1;
        extraDots -= 1;
      }
      columnBudget = Math.min(columnBudget, remainingBudget);
      if (columnBudget <= 0) {
        continue;
      }

      let columnRemaining = columnBudget;
      const ray = rays[i];
      const distance = Math.max(ray.distance, 0.0001);
      const distanceRatio = Math.min(distance / this.camera.maxDistance, 1);
      const wallHeight = Math.min(height, (height * 0.9) / distance);
      const wallTop = (height - wallHeight) / 2;
      const columnX = i * columnWidth;
      const columnCenter = columnX + columnWidth * 0.5;
      const wallLod = this.lodSystem.computeWall(distance);
      const wallShade = ray.side === 1 ? 0.7 : 1;
      const wallColor = this._interpolateWallColor(distanceRatio, wallShade);
      const horizon = height * 0.5;

      let floorShare = Math.max(6, Math.floor(columnBudget * 0.35));
      let ceilingShare = Math.max(4, Math.floor(columnBudget * 0.15));
      let wallShare = columnBudget - floorShare - ceilingShare;

      if (wallShare < 12) {
        const deficit = 12 - wallShare;
        wallShare = 12;
        const floorReduction = Math.min(deficit, Math.max(0, floorShare - 6));
        floorShare -= floorReduction;
        const ceilingReduction = Math.min(deficit - floorReduction, Math.max(0, ceilingShare - 3));
        ceilingShare -= ceilingReduction;
      }

      let totalShare = wallShare + floorShare + ceilingShare;
      if (totalShare > columnBudget) {
        const overflow = totalShare - columnBudget;
        const floorReduction = Math.min(overflow, Math.max(0, floorShare - 4));
        floorShare -= floorReduction;
        const ceilingReduction = Math.min(overflow - floorReduction, Math.max(0, ceilingShare - 2));
        ceilingShare -= ceilingReduction;
        wallShare = columnBudget - floorShare - ceilingShare;
      }

      if (wallShare < 6) {
        const deficit = 6 - wallShare;
        wallShare = 6;
        const floorReduction = Math.min(deficit, Math.max(0, floorShare - 4));
        floorShare -= floorReduction;
        const ceilingReduction = Math.min(deficit - floorReduction, Math.max(0, ceilingShare - 2));
        ceilingShare -= ceilingReduction;
      }

      floorShare = Math.max(2, floorShare);
      ceilingShare = Math.max(1, ceilingShare);
      totalShare = wallShare + floorShare + ceilingShare;
      if (totalShare > columnBudget) {
        const overflow = totalShare - columnBudget;
        const floorReduction = Math.min(overflow, Math.max(0, floorShare - 2));
        floorShare -= floorReduction;
        const ceilingReduction = overflow - floorReduction;
        ceilingShare = Math.max(1, ceilingShare - ceilingReduction);
        wallShare = columnBudget - floorShare - ceilingShare;
      }

      const drawDot = (x, y, diameter, color, alpha) => {
        if (columnRemaining <= 0 || remainingBudget <= 0) {
          return false;
        }
        const radius = Math.max(0.6, diameter * 0.5);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        columnRemaining -= 1;
        remainingBudget -= 1;
        dotCount += 1;
        return columnRemaining > 0 && remainingBudget > 0;
      };

      const wallDots = Math.min(wallShare, Math.max(10, Math.round(wallHeight / Math.max(1, wallLod.size))));
      for (let w = 0; w < wallDots; w += 1) {
        const t = (w + 0.5) / wallDots;
        const y = wallTop + t * wallHeight;
        const size = wallLod.size * (1.3 - t * 0.5);
        const opacity = Math.max(0.18, wallLod.opacity * (1.05 - t * 0.4));
        if (!drawDot(columnCenter, y, size, wallColor, opacity)) {
          break;
        }
      }

      if (columnRemaining <= 0 || remainingBudget <= 0) {
        continue;
      }

      const floorIterations = Math.min(floorShare, columnRemaining);
      const floorStart = Math.max(wallTop + wallHeight, horizon);
      const floorRange = Math.max(1, height - floorStart);
      for (let f = 0; f < floorIterations; f += 1) {
        const t = (f + 0.5) / Math.max(1, floorIterations);
        const eased = t * t;
        const y = floorStart + eased * floorRange;
        const sampleDistance = distance + eased * (this.camera.maxDistance - distance);
        const floorSample = this.lodSystem.computeFloor(sampleDistance);
        const size = floorSample.size * (1.05 + (1 - eased) * 0.75);
        const opacity = Math.max(0.18, floorSample.opacity * (0.65 + eased * 0.45));
        const floorColor = this._interpolateFloorColor(1 - eased * 0.85);
        if (!drawDot(columnCenter, y, size, floorColor, opacity)) {
          break;
        }
      }

      if (columnRemaining <= 0 || remainingBudget <= 0) {
        continue;
      }

      const ceilingIterations = Math.min(ceilingShare, columnRemaining);
      const ceilingRange = Math.max(1, wallTop);
      for (let c = 0; c < ceilingIterations; c += 1) {
        const t = (c + 0.5) / Math.max(1, ceilingIterations);
        const eased = t * t;
        const y = wallTop - eased * ceilingRange;
        const sampleDistance = distance + eased * (this.camera.maxDistance - distance) * 0.75;
        const ceilingSample = this.lodSystem.computeFloor(sampleDistance);
        const size = ceilingSample.size * (1 + (1 - eased) * 0.5);
        const opacity = Math.max(0.12, ceilingSample.opacity * (0.5 + (1 - eased) * 0.5));
        const ceilingColor = this._interpolateCeilingColor(eased * 0.9);
        if (!drawDot(columnCenter, y, size, ceilingColor, opacity)) {
          break;
        }
      }
    }

    ctx.globalAlpha = 1;
    this.lastDotCount = dotCount;
    return dotCount;
  }

  _interpolateWallColor(t, shade = 1) {
    const clamped = Math.min(Math.max(t, 0), 1);
    const base = this._lerpRgb(this._wallNearRGB, this._wallFarRGB, clamped);
    const shaded = this._scaleColor(base, shade);
    return this._rgbToString(shaded);
  }

  _interpolateFloorColor(t) {
    const clamped = Math.min(Math.max(t, 0), 1);
    const rgb = this._lerpRgb(this._floorNearRGB, this._floorFarRGB, clamped);
    return this._rgbToString(rgb);
  }

  _interpolateCeilingColor(t) {
    const clamped = Math.min(Math.max(t, 0), 1);
    const rgb = this._lerpRgb(this._ceilingNearRGB, this._ceilingFarRGB, clamped);
    return this._rgbToString(rgb);
  }

  _lerpRgb(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t)
    };
  }

  _scaleColor(rgb, factor) {
    return {
      r: Math.max(0, Math.min(255, Math.round(rgb.r * factor))),
      g: Math.max(0, Math.min(255, Math.round(rgb.g * factor))),
      b: Math.max(0, Math.min(255, Math.round(rgb.b * factor)))
    };
  }

  _rgbToString(rgb) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  _hexToRgb(hex) {
    const value = parseInt(hex.slice(1), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }
}

export default DotRenderer;
