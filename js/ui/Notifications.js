class Notifications {
  constructor(container) {
    this.container = container;
    this._messages = new Set();
  }

  info(message) {
    this.push(message, "info");
  }

  success(message) {
    this.push(message, "success");
  }

  error(message) {
    this.push(message, "error");
  }

  push(message, type = "info") {
    const normalized = this._normalize(message);
    const element = document.createElement("div");
    element.className = `notification notification-${type}`;
    element.textContent = normalized;
    this.container.appendChild(element);
    this._messages.add(element);
    setTimeout(() => {
      this._messages.delete(element);
      if (element.parentElement === this.container) {
        this.container.removeChild(element);
      }
    }, 3200);
  }

  clear() {
    this._messages.forEach((element) => {
      if (element.parentElement === this.container) {
        this.container.removeChild(element);
      }
    });
    this._messages.clear();
  }

  _normalize(message) {
    return String(message)
      .trim()
      .replace(/\s+/g, "_")
      .toUpperCase();
  }
}

export default Notifications;
