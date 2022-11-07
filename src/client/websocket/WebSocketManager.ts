import EventEmitter from 'node:events';
import WebSocketConnection from './WebSocketConnection';
import type Client from '../Client';

class WebSocketManager extends EventEmitter {
  private connection: WebSocketConnection | null;
  public client: Client;
  public heartbeatAck: boolean;

  constructor(client: Client) {
    super();

    /**
     * Client instance
     */
    this.client = client;

    /**
     * WebSocket connection
     */
    this.connection = null;

    /**
     * Check if app receives heartbeatAck
     */
    this.heartbeatAck = false;
  }

  public connect(gateway: string): boolean {
    if (!this.connection) {
      this.connection = new WebSocketConnection(this, gateway);
      return true;
    }

    return false;
  }

}

export default WebSocketManager;
