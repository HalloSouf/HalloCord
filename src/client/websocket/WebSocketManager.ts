import EventEmitter from 'node:events';
import WebSocketConnection from './WebSocketConnection';

class WebSocketManager extends EventEmitter {
  private connection: WebSocketConnection | null;

  constructor() {
    super();

    this.connection = null;
  }

  public connect(gateway: string): boolean {
    if (!this.connection) {
      this.connection = new WebSocketConnection(gateway);
      return true;
    }

    return false;
  }

}

export default WebSocketManager;
