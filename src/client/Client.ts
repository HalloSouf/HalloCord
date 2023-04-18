import EventEmitter from 'node:events';
import type { IClientOptions } from '../typings/client.interface';
import WebSocketManager from './websocket/WebSocketManager';

class Client extends EventEmitter {
  private ws: WebSocketManager;
  private intervals: Set<NodeJS.Timeout>;
  public options: IClientOptions;
  public token?: string;

  constructor(options: IClientOptions) {
    super();

    /**
     * The options that were passed to the client
     */
    this.options = options;

    /**
     * The intervals that are currently running
     */
    this.intervals = new Set();

    /**
     * The WebSocketManager that manages the WebSocket connection
     */
    this.ws = new WebSocketManager(this);
  }

  /**
   * Authorizes the client with a token
   * @param token The token to use for the client
   */
  public authorize(token: string): void {
    if (!token) throw new Error('No token was provided.');
    this.token = token;
    this.emit('debug', `Provided token: ${token.substring(0, 5)}...`);
    this.ws.connect('wss://gateway.discord.gg/?v=10&encoding=json');
  }

  /**
   * Adds an interval to the client
   * @param fn Function to be executed
   * @param interval 
   */
  public addInterval(fn: () => void, interval: number): NodeJS.Timeout {
    const createdInterval = setInterval(fn, interval);
    this.intervals.add(createdInterval);
    return createdInterval;
  }
}

export default Client;
