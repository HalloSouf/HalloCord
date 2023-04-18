import EventEmitter from 'node:events';
import { inflateSync } from 'node:zlib';
import type { IEvent, IHeartbeatPayload } from '../../typings/events.interface';
import { Opcodes } from '../../utils/Constants';
import { CloseEvent, ErrorEvent, MessageEvent, WebSocket } from 'ws';
import type WebSocketManager from './WebSocketManager';
import Intents from '../../utils/Intents';

class WebSocketConnection extends EventEmitter {
  private ws: WebSocket | null;
  private manager: WebSocketManager;
  private gateway: string;
  private sequence: number;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(manager: WebSocketManager, gateway: string) {
    super();

    this.sequence = -1;

    /**
     * The WebSocketManager that instantiated this WebSocketConnection
     */
    this.manager = manager;

    /**
     * The gateway that this WebSocketConnection will connect to
     */
    this.gateway = gateway;

    /**
     * The WebSocket connection that this WebSocketConnection manages
     */
    this.ws = null;

    /**
     * Connect to the gateway
     */
    this.connect();
  }

  /**
   * Connects to the gateway
   */
  private connect(): boolean {
    if (this.ws) {
      this.manager.debug('There is already an active WebSocket connection.');
      return false;
    }

    if (!this.gateway) {
      this.manager.debug('There is no gateway to connect to.');
      return false;
    }

    this.manager.debug(`Connecting to ${this.gateway}...`);

    this.ws = new WebSocket(this.gateway);
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.ws.onerror = this.onError.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);

    return true;
  }

  /**
   * Sends data over the websocket connection
   * @param data The data to send over the websocket connection
   */
  private send(data: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return this.manager.debug('There is no active WebSocket connection.');
    }

    this.manager.debug(`Sending data over websocket: ${JSON.stringify(data)}`);
    return this.ws.send(JSON.stringify(data));
  }

  /**
   * Destruct incoming packet from websocket event
   * @param packet The packet to destruct
   */
  private destructPacket(packet: IEvent<unknown>): void {
    this.manager.debug(`Received a ${packet.op} packet.`);

    switch (packet.op) {
      case Opcodes.Hello:
        this.heartbeat((packet as IEvent<IHeartbeatPayload>).d.heartbeat_interval);
        break;
      case Opcodes.Heartbeat:
        this.heartbeat();
        break;
      case Opcodes.Dispatch:
        this.handleDispatch(packet);
        break;
      default:
        this.manager.debug(`Received an unknown packet: ${packet.op}`);
        break;
    }
  }

  private handleDispatch(packet: IEvent<unknown>) {
    this.manager.debug(`Received a dispatch packet: ${packet.t}`);
  }

  /**
   * Sends a heartbeat to the gateway
   * @param interval Interval to send heartbeat at in milliseconds
   */
  private heartbeat(interval?: number): void {
    if (interval && !isNaN(interval)) {
      this.heartbeatInterval = this.manager.client.addInterval(() => this.heartbeat(), interval);
      return;
    }

    return this.send({ op: Opcodes.Heartbeat, d: null });
  }

  /**
   * Identifies the client to the gateway
   */
  private identify(): void {
    return this.send({
      op: Opcodes.Identify,
      d: {
        token: this.manager.client.token,
        intents: new Intents(this.manager.client.options.intents).bits,
        properties: {
          os: process.platform,
          browser: 'hallocord',
          device: 'hallocord'
        }
      }
    });
  }

  /**
   * WebSocket connection opened
   */
  private onOpen(): void {
    this.manager.debug('WebSocket connection opened.');
    this.identify();
  }

  /**
   * WebSocket connection closed
   * @param event The close event
   */
  private onClose(event: CloseEvent): void {
    switch (event.code) {
      case 4004:
        throw new Error('Invalid token.');
        break;
    }

    this.manager.debug(`WebSocket connection closed: ${event.reason} (${event.code})`);
  }

  /**
   * WebSocket connection errored
   * @param event The error event
   */
  private onError(event: ErrorEvent): void {
    this.manager.debug(`WebSocket connection errored: ${event.error}`);
  }

  /**
   * WebSocket connection received a message
   * @param event The message event
   */
  private onMessage(event: MessageEvent): void {
    let data;
    if (event.data instanceof ArrayBuffer) {
      data = Buffer.from(new Uint8Array(event.data as ArrayBuffer));
    } else if (event.data instanceof Buffer) {
      data = inflateSync(event.data as Buffer);
    } else {
      data = JSON.parse(event.data as string);
    }

    return this.destructPacket(data);
  }
}

export default WebSocketConnection;
