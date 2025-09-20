const getDocument = () => (typeof document !== "undefined" ? document : null);

export const getPointerLockElement = () => {
  const doc = getDocument();
  if (!doc) {
    return null;
  }
  return (
    doc.pointerLockElement ||
    doc.mozPointerLockElement ||
    doc.webkitPointerLockElement ||
    null
  );
};

export const exitPointerLock = () => {
  const doc = getDocument();
  if (!doc) {
    return;
  }
  const exit =
    doc.exitPointerLock || doc.mozExitPointerLock || doc.webkitExitPointerLock;
  if (typeof exit === "function") {
    exit.call(doc);
  }
};

export const requestPointerLock = (element) => {
  if (!element) {
    return false;
  }
  const request =
    element.requestPointerLock ||
    element.mozRequestPointerLock ||
    element.webkitRequestPointerLock;
  if (typeof request === "function") {
    request.call(element);
    return true;
  }
  return false;
};

export const POINTER_LOCK_CHANGE_EVENTS = [
  "pointerlockchange",
  "mozpointerlockchange",
  "webkitpointerlockchange"
];

export const POINTER_LOCK_ERROR_EVENTS = [
  "pointerlockerror",
  "mozpointerlockerror",
  "webkitpointerlockerror"
];
