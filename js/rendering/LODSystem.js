import Constants from "../core/Constants.js";

class LODSystem {
  constructor() {
    this.maxDistance = Constants.CAMERA.VIEW_DISTANCE;
    this.baseSize = Constants.RENDERING.DOT_BASE_SIZE;
    this.minSize = Constants.RENDERING.DOT_MIN_SIZE;
    this._wallResult = { size: this.baseSize, opacity: 1 };
    this._floorResult = { size: this.minSize, opacity: 0.3 };
  }

  computeWall(distance) {
    const size = this.baseSize / (1 + distance * 0.12);
    const opacity = Math.max(0.12, 1 - distance / this.maxDistance);
    this._wallResult.size = Math.max(this.minSize, size);
    this._wallResult.opacity = opacity;
    return this._wallResult;
  }

  computeFloor(distance) {
    const size = this.minSize / (1 + distance * 0.04);
    const opacity = Math.max(0.08, 0.6 - distance / (this.maxDistance * 1.5));
    this._floorResult.size = Math.max(0.5, size);
    this._floorResult.opacity = opacity;
    return this._floorResult;
  }
}

export default LODSystem;
