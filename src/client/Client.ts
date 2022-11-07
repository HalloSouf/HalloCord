import EventEmitter from 'node:events';
import WebSocketManager from './websocket/WebSocketManager';

class Client extends EventEmitter {
  private ws: WebSocketManager;
  private pings: Array<number>;
  public intervals: Set<NodeJS.Timeout>;

  constructor() {
    super();

    /**
     * WebSocket manager
     */
    this.ws = new WebSocketManager(this);

    /**
     * Save the last 2 pings
     */
    this.pings = [];

    /**
     * Set global client interval
     */
    this.intervals = new Set();
  }

  public login() {
    this.ws.connect('wss://gateway.discord.gg/?v=10&encoding=json');
  }

  /**
   * Pong when receiving heartbeatAck
   * @param timestamp
   */
  public pong(timestamp: number): void {
    this.pings.unshift(Date.now() - timestamp);
    if (this.pings.length > 2) this.pings.length = 2;
    this.ws.heartbeatAck = true;
  }

  public addInterval(fn: () => void, interval: number): NodeJS.Timeout {
    const createdInterval = setInterval(fn, interval);
    this.intervals.add(createdInterval);
    return createdInterval;
  }

  public removeInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

}

export default Client;
