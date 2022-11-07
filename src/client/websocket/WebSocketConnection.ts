import EventEmitter from 'node:events';
import { inflateSync } from 'node:zlib';
import { Buffer } from 'buffer';
import WebSocket, { CloseEvent, ErrorEvent, type Event, type MessageEvent } from 'ws';
import { Status, Opcodes } from '../../utils/Constants';
import type { IEvent, IHeartbeatPayload } from '../../typings/events.interface';
import type WebSocketManager from './WebSocketManager';
import type Client from '../Client';

class WebSocketConnection extends EventEmitter {
  private ws: WebSocket | null;
  private readonly sequence: number;
  private client: Client;
  private heartbeatInterval?: NodeJS.Timeout | null;
  public lastPingTimestamp: number;
  public gateway?: string;
  public status: string;

  constructor(manager: WebSocketManager, gateway: string) {
    super();

    /**
     * WebSocket instance
     */
    this.ws = null;

    this.client = manager.client;

    /**
     * The last timestamp when the app have sent a ping to the Discord gateway
     */
    this.lastPingTimestamp = 0;

    /**
     * Current sequence of the websocket
     */
    this.sequence = -1;

    /**
     * Current status of the websocket
     */
    this.status = Status.Idle;

    this.connect(gateway);
  }

  /**
   * Establish websocket connection
   * @param gateway Discord gateway
   */
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
    ws.onclose = this.onClose.bind(this);

    this.status = Status.Connecting;

    return true;
  }

  private send(data: Object): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return console.debug('There is no available websocket open!');
    }

    return this.ws.send(JSON.stringify(data));
  }

  /**
   * Destruct packet events from Discord gateway
   * @param packet Packet event
   * @private
   */
  private destructPacket(packet: IEvent) {
    console.log(packet);
    switch (packet.op) {
      case Opcodes.Hello:
        this.heartbeat((packet as IEvent<IHeartbeatPayload>).d.heartbeat_interval);
        break;
      case Opcodes.HeartbeatACK:
        this.heartbeatAck();
        break;
      case Opcodes.Heartbeat:
        this.heartbeat();
        break;
    }
  }

  private heartbeatAck(): void {
    this.client.pong(this.lastPingTimestamp);
  }

  private heartbeat(interval?: number): void {
    if (interval && !isNaN(interval)) {
      if (interval === -1 && this.heartbeatInterval) {
        console.debug('Unset heartbeat interval');
        this.client.removeInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
        return;
      }

      console.debug('Set heartbeat interval');
      this.heartbeatInterval = this.client.addInterval(() => this.heartbeat(), interval);
      return;
    }

    console.debug(`Sending heartbeat with sequence ${this.sequence}`);
    this.lastPingTimestamp = Date.now();
    return this.send({
      op: 1,
      d: this.sequence
    });
  }

  /**
   * WebSocket onOpen handler
   * @param event WebSocket event
   * @private
   */
  private onOpen(event: Event): void {
    if (event) this.gateway = event.target.url;
    console.debug(`Connected to the gateway: ${event.target.url}`);
  }

  private onClose(event: CloseEvent): void {
    console.debug('Connection closed...', event);
  }

  /**
   * WebSocket onMessage handler
   * @param event WebSocket event
   * @private
   */
  private onMessage(event: MessageEvent): void {
    let data;
    if (event.data instanceof ArrayBuffer) {
      data = Buffer.from(new Uint8Array(<ArrayBuffer>event.data));
    } else if (event.data instanceof Buffer) {
      data = inflateSync(<Buffer>event.data).toString();
    } else {
      data = JSON.parse(<string>event.data);
    }

    return this.destructPacket(data);
  }

  /**
   * WebSocket onError handler
   * @param event WebSocket event
   * @private
   */
  private onError(event: ErrorEvent): void {
    console.debug(`Error has occurred while connecting to gateway: ${event.message}`);
  }

}

export default WebSocketConnection;
