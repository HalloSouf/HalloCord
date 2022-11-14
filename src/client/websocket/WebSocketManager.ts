import EventEmitter from 'node:events';
import WebSocketConnection from './WebSocketConnection';
import type Client from '../Client';

class WebSocketManager extends EventEmitter {
  private connection: WebSocketConnection | null;
  public client: Client;
  public heartbeatAck: boolean;
  public pings: number[];

  constructor(client: Client) {
    super();

    this.client = client;

    this.connection = null;

    this.pings = [];

    this.heartbeatAck = false;
  }

  public debug(message: string): void {
    this.client.emit('debug', `[WS] ${message}`);
  }

  public pong(timestamp: number): void {
    this.pings.unshift(Date.now() - timestamp);
    if (this.pings.length > 2) this.pings.length = 2;
    this.heartbeatAck = true;
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