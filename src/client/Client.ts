import EventEmitter from 'node:events';
import WebSocketManager from './websocket/WebSocketManager';
import type { ClientOptions } from '../typings/client.interface';

class Client extends EventEmitter {
  private ws: WebSocketManager;
  public token?: string;
  public intervals: Set<NodeJS.Timeout>;
  public options: ClientOptions;

  constructor(options: ClientOptions) {
    super();

    this.options = options;

    this.ws = new WebSocketManager(this);

    this.intervals = new Set();
  }

  public authorize(token: string) {
    if (!token) throw new Error('Provided invalid token');
    this.token = token;
    this.emit('debug', `Provided token: ${token.substring(0, 5)}`);
    this.ws.connect('wss://gateway.discord.gg/?v=10&encoding=json');
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