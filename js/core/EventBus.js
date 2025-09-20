class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(eventName, handler) {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }
    this._listeners.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  once(eventName, handler) {
    const wrapper = (...args) => {
      handler(...args);
      this.off(eventName, wrapper);
    };
    return this.on(eventName, wrapper);
  }

  off(eventName, handler) {
    const handlers = this._listeners.get(eventName);
    if (!handlers) {
      return;
    }
    handlers.delete(handler);
    if (handlers.size === 0) {
      this._listeners.delete(eventName);
    }
  }

  emit(eventName, payload) {
    const handlers = this._listeners.get(eventName);
    if (!handlers) {
      return;
    }
    handlers.forEach((handler) => handler(payload));
  }

  clear() {
    this._listeners.clear();
  }
}

export default EventBus;
