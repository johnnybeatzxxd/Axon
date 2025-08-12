/* Lightweight WebSocket client with auto-reconnect and event listeners */

export class ChatWebSocketClient {
  constructor({ url, protocols, maxRetries = 8, onOpen, onClose, onError } = {}) {
    this.url = url;
    this.protocols = protocols;
    this.maxRetries = maxRetries;
    this.retryCount = 0;
    this.ws = null;
    this.listeners = new Set();
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onError = onError;
    this._shouldReconnect = true;
    this._queue = [];
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      this.ws = new WebSocket(this.url, this.protocols);
    } catch (err) {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.onOpen?.();
      // Identify client to backend right away
      try {
        this.ws.send(JSON.stringify({ event: 'client_connected', ts: Date.now() }));
      } catch (_) { /* ignore */ }
      // Flush queued messages
      if (this._queue.length) {
        for (const payload of this._queue) {
          try { this.ws.send(payload); } catch (_) { /* ignore */ }
        }
        this._queue = [];
      }
    };

    this.ws.onmessage = (event) => {
      let data = null;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        // Non-JSON payloads are ignored
        return;
      }
      for (const cb of this.listeners) {
        try { cb(data); } catch (_) { /* ignore listener errors */ }
      }
    };

    this.ws.onerror = (err) => {
      this.onError?.(err);
    };

    this.ws.onclose = (evt) => {
      this.onClose?.(evt);
      if (this._shouldReconnect) this._scheduleReconnect();
    };
  }

  _scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) return;
    const delay = Math.min(1000 * 2 ** this.retryCount, 15000);
    this.retryCount += 1;
    setTimeout(() => this.connect(), delay);
  }

  sendJson(obj) {
    const payload = JSON.stringify(obj);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try { this.ws.send(payload); } catch (_) { /* ignore */ }
    } else {
      // enqueue until open
      this._queue.push(payload);
    }
  }

  addMessageListener(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  disconnect() {
    this._shouldReconnect = false;
    try { this.ws?.close(); } catch (_) {}
  }
}

export function resolveWebSocketUrl() {
  // Allow override via env var
  const envUrl = import.meta?.env?.VITE_WS_URL;
  if (envUrl) return envUrl;
  // Default to local FastAPI on loopback to avoid host resolution issues
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://127.0.0.1:8000/ws/connect`;
}


