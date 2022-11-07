import EventEmitter from 'node:events';
import { inflateSync } from 'node:zlib';
import { Buffer } from 'buffer';
import WebSocket, { ErrorEvent, type Event, type MessageEvent } from 'ws';
import { Status } from '../../utils/Constants';

class WebSocketConnection extends EventEmitter {
  private ws: WebSocket | null;
  public gateway?: string;
  public status: string;

  constructor(gateway: string) {
    super();

    /**
     * WebSocket instance
     */
    this.ws = null;

    /**
     *
     */
    this.status = Status.Idle;

    this.connect(gateway);
  }

  public connect(gateway?: string): boolean {
    if (this.ws) {
      console.debug('Can not establish connection. There is already one which exists.');
      return false;
    }

    if (!gateway) {
      console.debug(`Can not establish connection. Tried to connect to invalid gateway: ${gateway}`);
      return false;
    }

    this.gateway = gateway;
    console.debug(`Connecting to gateway: ${gateway}`);

    const ws = this.ws = new WebSocket(gateway);
    ws.onopen = this.onOpen.bind(this);
    ws.onmessage = this.onMessage.bind(this);
    ws.onerror = this.onError.bind(this);

    this.status = Status.Connecting;

    return true;
  }

  private onOpen(event: Event): void {
    if (event) this.gateway = event.target.url;
    console.debug(`Connected to the gateway: ${event.target.url}`);
  }

  private onMessage(event: MessageEvent): Object {
    let data;
    if (event.data instanceof ArrayBuffer) {
      data = Buffer.from(new Uint8Array(<ArrayBuffer>event.data));
    } else if (event.data instanceof Buffer) {
      data = inflateSync(<Buffer>event.data).toString();
    } else {
      data = JSON.parse(<string>event.data);
    }

    return data;
  }

  private onError(event: ErrorEvent): void {
    console.debug(`Error has occurred while connecting to gateway: ${event.message}`);
  }

}

export default WebSocketConnection;
