import Constants from "../core/Constants.js";

class ViewFrustum {
  constructor(camera) {
    this.camera = camera;
    this._halfFov = Constants.CAMERA.FOV / 2;
    this._maxDistance = Constants.CAMERA.VIEW_DISTANCE;
  }

  isInView(x, y) {
    const dx = x - this.camera.position.x;
    const dy = y - this.camera.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance > this._maxDistance) {
      return false;
    }
    const angle = Math.atan2(dy, dx);
    let diff = angle - this.camera.angle;
    diff = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
    return Math.abs(diff) <= this._halfFov;
  }
}

export default ViewFrustum;
