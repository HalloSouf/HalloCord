import { EventEmitter } from 'node:events';
import type Client from '../Client';
import WebSocketConnection from './WebSocketConnection';

class WebSocketManager extends EventEmitter {
  private connection: WebSocketConnection | null;
  public client: Client;

  constructor(client: Client) {
    super();

    /**
     * The WebSocket connection that this WebSocketManager manages
     */
    this.connection = null;

    /**
     * The client that instantiated this WebSocketManager
     */
    this.client = client;
  }

  /**
   * Emit a debug event
   * @param message Message to emit as a debug event
   */
  public debug(message: string): void {
    this.client.emit('debug', `[WS] ${message}`);
  }

  /**
   * Connect to the Discord gateway
   * @param gateway Discord gateway to connect to
   */
  public connect(gateway: string): boolean {
    if (!this.connection) {
      this.connection = new WebSocketConnection(this, gateway);
      return true;
    }

   return false; 
  }
}

export default WebSocketManager;
